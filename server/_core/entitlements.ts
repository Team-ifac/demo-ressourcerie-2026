import * as db from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Entitlements canonique (outil national)
 * - 1 seule source de vérité partagée entre:
 *   - tRPC routers
 *   - routes HTTP (download, etc.)
 */

export type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
export type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";

export async function resolveProfileType(userId: number): Promise<ProfileType | null> {
  try {
    const p: any = await db.getUserProfile(userId);
    if (!p) return null;
    if (typeof p === "string") return p as ProfileType;
    if (p?.profileType) return p.profileType as ProfileType;
    return null;
  } catch (e) {
    console.warn("[resolveProfileType] Unable to resolve profile type:", e);
    return null;
  }
}

export async function resolveIsPremium(userId: number): Promise<boolean> {
  try {
    const dbConn = await db.getDb();
    if (!dbConn) return false;

    // 1) ✅ PREMIUM OVERRIDE (users.premiumOverride) — version stable (Drizzle select)
    try {
      const rows: any[] = await dbConn
        .select()
        .from(users as any)
        .where(eq((users as any).id, userId))
        .limit(1);

      const row: any = rows?.[0] ?? null;
      const overrideVal = row?.premiumOverride ?? null;

      if (
        overrideVal === 1 ||
        overrideVal === true ||
        overrideVal === "1" ||
        overrideVal === "true"
      ) {
        return true;
      }
    } catch (e) {
      console.warn("[resolveIsPremium] premiumOverride Drizzle check skipped:", e);
    }

    // 2) ✅ legacy : user_entitlements (si présent)
    try {
      const schema = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      const userEntitlementsTable =
        (schema as any).userEntitlements ||
        (schema as any).user_entitlements ||
        (schema as any).userEntitlementsTable ||
        (schema as any).user_entitlements_table;

      if (userEntitlementsTable) {
        const row = await dbConn
          .select()
          .from(userEntitlementsTable)
          .where(eq((userEntitlementsTable as any).userId, userId))
          .limit(1);

        const ue = (row?.[0] as any) || null;

        if (ue && (ue.premium === 1 || ue.premium === true)) {
          const until = ue.premiumUntil ? new Date(ue.premiumUntil) : null;
          if (!until) return true;
          if (until.getTime() > Date.now()) return true;
        }
      }
    } catch (e) {
      console.warn("[resolveIsPremium] user_entitlements check skipped:", e);
    }

    // 3) ✅ nouveau système : entitlements (Stripe / droits datés)
    try {
      const { entitlements } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      if (entitlements) {
        const rows = await dbConn
          .select()
          .from(entitlements)
          .where(eq((entitlements as any).userId, userId));

        const now = new Date();

        const valid = (rows || []).find((r: any) => {
          if (r.type !== "PREMIUM") return false;
          if (r.isActive !== 1) return false;
          if (!r.endsAt) return true;
          return new Date(r.endsAt) > now;
        });

        return !!valid;
      }
    } catch (e) {
      console.warn("[resolveIsPremium] entitlements table check skipped:", e);
    }

    return false;
  } catch (e) {
    console.warn("[resolveIsPremium] premium check failed:", e);
    return false;
  }
}

export function allowedAccessLevels(isLogged: boolean, isPremium: boolean): AccessLevel[] {
  // SAFE-BY-DEFAULT :
  // - visiteur : PUBLIC
  // - connecté non premium : PUBLIC + INTERNAL_IFAC
  // - premium : PUBLIC + INTERNAL_IFAC + PREMIUM
  if (!isLogged) return ["PUBLIC"];
  if (isPremium) return ["PUBLIC", "INTERNAL_IFAC", "PREMIUM"];
  return ["PUBLIC", "INTERNAL_IFAC"];
}

export async function buildEntitlementsForUser(user: any | null): Promise<{
  isLogged: boolean;
  isAdmin: boolean;
  myProfileType: ProfileType | null;
  entitlements: { isAuthenticated: boolean; isPremium: boolean; isStaff: boolean };
}> {
  const isLogged = !!user;
  const isAdmin = user?.role === "admin";

  const myProfileType = isLogged ? await resolveProfileType(user.id) : null;
  const isPremium = isLogged ? await resolveIsPremium(user.id) : false;

  // ✅ Règle “staff” (outil national) : formateur = staff
  const isStaff = isLogged && myProfileType === "formateur";

  return {
    isLogged,
    isAdmin,
    myProfileType,
    entitlements: {
      isAuthenticated: isLogged,
      isPremium,
      isStaff,
    },
  };
}