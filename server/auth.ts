import { hash, verify } from "argon2";
import { getDb } from "./db";
import { users, userProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Convertit une Date en format MySQL DATETIME: "YYYY-MM-DD HH:MM:SS"
 */
function toMySqlDateTime(date: Date): string {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

/**
 * Parse une date MySQL ("YYYY-MM-DD HH:MM:SS") de façon fiable en Date JS.
 * On force UTC pour éviter les surprises.
 */
function parseMySqlDateTime(value: unknown): Date | null {
  if (!value) return null;

  // Si drizzle renvoie déjà un Date
  if (value instanceof Date) return value;

  // Si c'est une string MySQL
  if (typeof value === "string") {
    // "2026-01-09 20:04:07" => "2026-01-09T20:04:07Z"
    const iso = value.includes("T") ? value : value.replace(" ", "T");
    const withZ = iso.endsWith("Z") ? iso : `${iso}Z`;
    const d = new Date(withZ);
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }

  return null;
}

/**
 * Génère un token aléatoire pour la vérification d'email
 */
export function generateEmailVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password);
}

/**
 * Vérifie un mot de passe
 */
export async function verifyPassword(
  password: string,
  passwordHash: string
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Crée un nouvel utilisateur avec email/mot de passe
 * IMPORTANT: on récupère le userId en relisant l’utilisateur via openId (au lieu de insertId).
 * IMPORTANT: on met tout dans une transaction (insert user + select id + insert profile).
 */
export async function createUserWithEmail(data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profileType: string;
}): Promise<{ userId: number; verificationToken: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  // Vérifier si l'email existe déjà
  const existingUser = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, data.email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new Error("Email already registered");
  }

  // Hash le mot de passe
  const passwordHash = await hashPassword(data.password);

  // Générer un token de vérification
  const verificationToken = generateEmailVerificationToken();

  // Générer un openId unique pour l'utilisateur (prévisible et relisible)
  const openId = `email_${crypto.randomBytes(16).toString("hex")}`;

  // Transaction: user -> relire id -> profile
  const result = await db.transaction(async (tx) => {
    // 1) Créer l'utilisateur
    await tx.insert(users).values({
      openId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      emailVerified: 0,
      emailVerificationToken: verificationToken,
      loginMethod: "email",
    });

    // 2) Relire l’utilisateur pour récupérer son id (fiable)
    const inserted = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.openId, openId))
      .limit(1);

    const rawId = inserted?.[0]?.id;
    const userId = rawId ? Number(rawId) : 0;

    if (!userId || userId === 0) {
      throw new Error(
        "User created but could not retrieve userId via openId (check users.openId mapping and DB constraints)"
      );
    }

    // 3) Créer le profil utilisateur (FK)
    const profileTypeMap: Record<string, number> = {
  animateur: 1,
  formateur: 2,
  directeur: 3,
  stagiaire_bafa: 4,
};

await tx.insert(userProfiles).values({
  userId,
  profileTypeId: profileTypeMap[data.profileType],
});

    return userId;
  });

  return { userId: result, verificationToken };
}

/**
 * Trouve un utilisateur par email
 */
export async function findUserByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user[0] || null;
}

/**
 * Vérifie le token d'email et active le compte
 */
export async function verifyUserEmail(token: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.emailVerificationToken, token))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("Invalid or expired verification token");
  }

  const userData = user[0];

  await db
    .update(users)
    .set({
      emailVerified: 1,
      emailVerificationToken: null,
    })
    .where(eq(users.id, userData.id));

  return { userId: userData.id, email: userData.email };
}

/**
 * Authentifie un utilisateur avec email/mot de passe
 * (En dev tu as choisi d’autoriser même si email non vérifié.)
 */
export async function authenticateWithEmail(email: string, password: string) {
  const user = await findUserByEmail(email);

  if (!user || !user.passwordHash) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  return {
    userId: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
  };
}

/**
 * Renvoie un email de vérification pour un utilisateur existant
 */
export async function resendVerificationEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await findUserByEmail(email);

  if (!user) {
    return { success: true, message: "Si un compte existe, un email a été envoyé" };
  }

  if (user.emailVerified) {
    return { success: true, message: "Compte déjà vérifié" };
  }

  const newToken = generateEmailVerificationToken();

  await db
    .update(users)
    .set({ emailVerificationToken: newToken })
    .where(eq(users.id, user.id));

  try {
    const { sendVerificationEmail } = await import("./emailService");
    await sendVerificationEmail(email, newToken);
  } catch (error) {
    console.error("[Auth] Failed to resend verification email:", error);
  }

  return { success: true, message: "Si un compte existe, un email a été envoyé" };
}

/**
 * Génère un token de réinitialisation de mot de passe
 */
export function generatePasswordResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Demande une réinitialisation de mot de passe
 */
export async function requestPasswordReset(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await findUserByEmail(email);

  if (!user) {
    return { success: true, message: "Si un compte existe, un email de réinitialisation a été envoyé" };
  }

  const resetToken = generatePasswordResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  const expiresAtMySql = toMySqlDateTime(expiresAt);

  await db
    .update(users)
    .set({
      passwordResetToken: resetToken,
      passwordResetExpiresAt: expiresAtMySql,
    })
    .where(eq(users.id, user.id));

  try {
    const { sendPasswordResetEmail } = await import("./emailService");
    await sendPasswordResetEmail(email, resetToken);
  } catch (error) {
    console.error("[Auth] Failed to send password reset email:", error);
  }

  return { success: true, message: "Si un compte existe, un email de réinitialisation a été envoyé" };
}

/**
 * Réinitialise le mot de passe avec un token
 */
export async function resetPassword(token: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);

  if (!user || user.length === 0) {
    throw new Error("Invalid or expired reset token");
  }

  const userData = user[0];

  // ✅ FIX : parsing robuste de la date stockée en MySQL
  const expires = parseMySqlDateTime((userData as any).passwordResetExpiresAt);
  if (expires && expires.getTime() < Date.now()) {
    throw new Error("Reset token has expired");
  }

  const passwordHash = await hashPassword(newPassword);

  await db
    .update(users)
    .set({
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiresAt: null,
    })
    .where(eq(users.id, userData.id));

  return { userId: userData.id, email: userData.email };
}

/**
 * Met à jour le profil utilisateur
 */
export async function updateUserProfile(
  userId: number,
  data: { firstName?: string; lastName?: string; email?: string; phone?: string }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  if (data.email) {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      throw new Error("Email already in use");
    }
  }

  const updateData: Record<string, any> = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.email !== undefined) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;

  if (Object.keys(updateData).length === 0) {
    throw new Error("No data to update");
  }

  await db.update(users).set(updateData).where(eq(users.id, userId));

  return { success: true };
}

/**
 * Change le mot de passe d'un utilisateur authentifié
 */
export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not initialized");

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user || user.length === 0) {
    throw new Error("User not found");
  }

  const userData = user[0];

  if (!userData.passwordHash) {
    throw new Error("User has no password set");
  }

  const isPasswordValid = await verifyPassword(currentPassword, userData.passwordHash);
  if (!isPasswordValid) {
    throw new Error("Current password is incorrect");
  }

  const newPasswordHash = await hashPassword(newPassword);

  await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, userId));

  return { success: true };
}
