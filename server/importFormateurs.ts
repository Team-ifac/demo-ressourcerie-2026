import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { hashPassword, generateEmailVerificationToken, generatePasswordResetToken } from "./auth";
import { eq, inArray } from "drizzle-orm";
import XLSX from "xlsx";
import { sendPasswordResetEmail } from "./emailService";



interface FormateurData {
  nom: string;
  prenom: string;
  email: string;
  identifiant: string;
  motDePasse: string;
}

/**
 * Importe les formateurs depuis un fichier Excel
 */
export async function importFormateurs(filePath: string): Promise<{
  success: number;
  failed: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let success = 0;
  let failed = 0;

  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet) as any[];

    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    // Extraire tous les emails du fichier
    const emails = data
      .map(row => row["Email"] || row["email"] || row["Adresse email perso"] || row["adresse email perso"] || row["email perso"] || row["Email perso"] || "")
      .filter(email => email && email.trim());

    // Vérifier les emails existants en une seule requête
    const existingEmails = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.email, emails));

    const existingEmailSet = new Set(existingEmails.map(u => u.email));

    // Préparer les données à insérer
    const usersToInsert = [];
    const profilesToInsert = [];
    const emailToResetToken = new Map();

    for (const row of data) {
      try {
        // Mapper les colonnes du fichier Excel
        const formateurData: FormateurData = {
          nom: row["Nom"] || row["nom"] || "",
          prenom: row["Prénom"] || row["prenom"] || "",
          email: row["Email"] || row["email"] || row["Adresse email perso"] || row["adresse email perso"] || row["email perso"] || row["Email perso"] || "",
          identifiant: row["Identifiant"] || row["identifiant"] || "",
          motDePasse: row["Mot de passe"] || row["mot_de_passe"] || "",
        };

        // Valider les données
        if (!formateurData.email || !formateurData.nom || !formateurData.prenom) {
          errors.push(`Ligne invalide : données manquantes (${formateurData.email})`);
          failed++;
          continue;
        }

        // Vérifier que l'email n'existe pas déjà
        if (existingEmailSet.has(formateurData.email)) {
          errors.push(`Email déjà existant : ${formateurData.email}`);
          failed++;
          continue;
        }

        // Créer un openId unique
        const openId = `formateur_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // Hasher le mot de passe
        const passwordHash = await hashPassword(formateurData.motDePasse);

        // Créer le token de réinitialisation
        const resetToken = generatePasswordResetToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

        usersToInsert.push({
          openId,
          email: formateurData.email,
          firstName: formateurData.prenom,
          lastName: formateurData.nom,
          loginMethod: "email" as const,
          role: "user" as const,
          passwordHash,
          emailVerified: 1,
          passwordResetToken: resetToken,
          passwordResetExpiresAt: expiresAt.toISOString(),
        });

        emailToResetToken.set(formateurData.email, resetToken);
      } catch (error: any) {
        errors.push(`Erreur lors du traitement : ${error.message}`);
        failed++;
      }
    }

    // Insérer tous les utilisateurs en une seule requête
    if (usersToInsert.length > 0) {
      await db.insert(users).values(usersToInsert);

      // Récupérer les IDs des utilisateurs créés
      const createdUsers = await db
        .select()
        .from(users)
        .where(inArray(users.email, usersToInsert.map(u => u.email)));

      // Préparer les profils à insérer
      for (const user of createdUsers) {
        profilesToInsert.push({
          userId: user.id,
          profileType: "formateur" as const,
        });
      }

      // Insérer tous les profils en une seule requête
      if (profilesToInsert.length > 0) {
        await db.insert(userProfiles).values(profilesToInsert);
      }

      success = createdUsers.length;
    }

    return { success, failed, errors };
  } catch (error: any) {
    throw new Error(`Erreur lors de la lecture du fichier : ${error.message}`);
  }
}

/**
 * Récupère les formateurs créés pour l'envoi d'emails
 */
export async function getNewFormateurs() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(users)
    .innerJoin(userProfiles, eq(users.id, userProfiles.userId))
    .where(eq(userProfiles.profileType, "formateur"));
}
