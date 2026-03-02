import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { hashPassword, generatePasswordResetToken } from "./auth";
import { eq, inArray, sql } from "drizzle-orm";
import XLSX from "xlsx";
import crypto from "crypto";

interface FormateurData {
  nom: string;
  prenom: string;
  email: string;
  identifiant: string;
  motDePasse: string;
}

type ImportResult = { success: number; failed: number; errors: string[] };

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

function normalizeEmail(email: string): string {
  return (email || "").trim().toLowerCase();
}

async function getProfileTypeId(db: any, key: "formateur"): Promise<number> {
  const { profileTypes } = await import("../drizzle/schema");
  const rows = await db
    .select({ id: profileTypes.id })
    .from(profileTypes)
    .where(eq(profileTypes.key, key))
    .limit(1);

  const id = rows?.[0]?.id;
  if (!id) throw new Error(`Profile type id not found for key: "${key}"`);
  return id;
}

function readRowsFromFile(filePath: string): any[] {
  // XLSX peut lire xlsx/xls/csv via readFile.
  // Pour csv, il charge une sheet unique.
  const workbook = XLSX.readFile(filePath, { raw: true });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  return (XLSX.utils.sheet_to_json(worksheet) as any[]) || [];
}

/**
 * Importe les formateurs depuis un fichier Excel (.xlsx/.xls) ou CSV (.csv)
 */
export async function importFormateurs(filePath: string): Promise<ImportResult> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const data = readRowsFromFile(filePath);

    // Extraire tous les emails du fichier
    const emails = data
      .map((row) =>
        normalizeEmail(
          row["Email"] ||
            row["email"] ||
            row["Adresse email perso"] ||
            row["adresse email perso"] ||
            row["email perso"] ||
            row["Email perso"] ||
            ""
        )
      )
      .filter((email) => email);

    // Emails existants
    const existingEmails = emails.length
      ? await db.select({ email: users.email }).from(users).where(inArray(users.email, emails))
      : [];

    const existingEmailSet = new Set(existingEmails.map((u: any) => normalizeEmail(u.email)));

    // Préparer insert users
    const usersToInsert: any[] = [];

    for (const row of data) {
      try {
        const formateurData: FormateurData = {
          nom: (row["Nom"] || row["nom"] || "").toString().trim(),
          prenom: (row["Prénom"] || row["prenom"] || "").toString().trim(),
          email: normalizeEmail(
            row["Email"] ||
              row["email"] ||
              row["Adresse email perso"] ||
              row["adresse email perso"] ||
              row["email perso"] ||
              row["Email perso"] ||
              ""
          ),
          identifiant: (row["Identifiant"] || row["identifiant"] || "").toString().trim(),
          motDePasse: (row["Mot de passe"] || row["mot_de_passe"] || row["Mot de passe Teams"] || "").toString(),
        };

        if (!formateurData.email || !formateurData.nom || !formateurData.prenom) {
          errors.push(`Ligne invalide : données manquantes (${formateurData.email || "email manquant"})`);
          failed++;
          continue;
        }

        if (existingEmailSet.has(formateurData.email)) {
          errors.push(`Email déjà existant : ${formateurData.email}`);
          failed++;
          continue;
        }

        // mot de passe : si vide, on met un temporaire (puis reset via token)
        const tempPassword =
          formateurData.motDePasse && formateurData.motDePasse.trim()
            ? formateurData.motDePasse
            : crypto.randomBytes(12).toString("base64url");

        const passwordHash = await hashPassword(tempPassword);

        const openId = `formateur_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        const resetToken = generatePasswordResetToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

               usersToInsert.push({
          openId,
          name: `${formateurData.prenom} ${formateurData.nom}`.trim(),
          email: formateurData.email,
          firstName: formateurData.prenom,
          lastName: formateurData.nom,
          loginMethod: "email" as const,
          role: "user" as const,
          passwordHash,
          emailVerified: 1,
          passwordResetToken: resetToken,
          passwordResetExpiresAt: expiresAt,
        });
      } catch (error: any) {
        errors.push(`Erreur lors du traitement : ${error.message}`);
        failed++;
      }
    }

    if (usersToInsert.length === 0) {
      return { success, failed, errors };
    }

    // 🔥 TRANSACTION COMPLETE (atomicité) : users + user_profiles
    const USER_BATCH_SIZE = 200;
    const PROFILE_BATCH_SIZE = 500;

    console.log("[IMPORT_FORMATEURS] Nombre d'utilisateurs à insérer :", usersToInsert.length);

    const result = await db.transaction(async (tx: any) => {
      let totalAffected = 0;

      // 1) INSERT USERS
      for (const batch of chunkArray(usersToInsert, USER_BATCH_SIZE)) {
        const first = batch[0];
        const last = batch[batch.length - 1];

        console.log(
          `[IMPORT_FORMATEURS] Insertion batch users (${batch.length}) | first=${first?.email} | last=${last?.email}`
        );

        try {
          const res: any = await tx.insert(users).values(batch).execute();

          const affected =
            typeof res?.affectedRows === "number"
              ? res.affectedRows
              : typeof res?.[0]?.affectedRows === "number"
                ? res[0].affectedRows
                : typeof res?.rowsAffected === "number"
                  ? res.rowsAffected
                  : null;

          console.log("[IMPORT_FORMATEURS] Batch affectedRows =", affected ?? "unknown");
          if (typeof affected === "number") totalAffected += affected;
        } catch (e: any) {
          console.error("[IMPORT_FORMATEURS] ❌ ERREUR INSERT USERS (batch)", {
            message: e?.message,
            code: e?.code,
            errno: e?.errno,
            sqlState: e?.sqlState,
            sqlMessage: e?.sqlMessage,
          });
          throw e; // rollback transaction
        }
      }

      // 2) SELECT created users (dans la transaction)
      const createdUsers = await tx
        .select()
        .from(users)
        .where(inArray(users.email, usersToInsert.map((u) => u.email)));

      // 3) profileTypeId formateur (dans la transaction)
      const formateurProfileTypeId = await getProfileTypeId(tx, "formateur");

      // 4) INSERT user_profiles
      const profilesToInsert = createdUsers.map((user: any) => ({
        userId: user.id,
        profileTypeId: formateurProfileTypeId,
      }));

      for (const batch of chunkArray(profilesToInsert, PROFILE_BATCH_SIZE)) {
        try {
          await tx.insert(userProfiles).values(batch).execute();
        } catch (e: any) {
          console.error("[IMPORT_FORMATEURS] ❌ ERREUR INSERT USER_PROFILES (batch)", {
            message: e?.message,
            code: e?.code,
            errno: e?.errno,
            sqlState: e?.sqlState,
            sqlMessage: e?.sqlMessage,
          });
          throw e; // rollback transaction
        }
      }

      // 5) Vérif post-insert (COUNT) — toujours dans la transaction
      const [{ count }] = await tx
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(inArray(users.email, usersToInsert.map((u) => u.email)));

      console.log("[IMPORT_FORMATEURS] Vérif post-insert (count via emails) =", count);
      console.log("[IMPORT_FORMATEURS] totalAffected (si dispo) =", totalAffected);

      return { createdUsersCount: createdUsers.length };
    });

    success = result.createdUsersCount;
    return { success, failed, errors };
  } catch (error: any) {
    throw new Error(`Erreur lors de la lecture du fichier : ${error.message}`);
  }
}

/**
 * Récupère les formateurs créés
 */
export async function getNewFormateurs() {
  const db = await getDb();
  if (!db) return [];

  const formateurProfileTypeId = await getProfileTypeId(db, "formateur");

  return await db
    .select()
    .from(users)
    .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(userProfiles.profileTypeId, formateurProfileTypeId));
}