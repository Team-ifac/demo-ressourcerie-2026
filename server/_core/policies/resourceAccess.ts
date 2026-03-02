// server/_core/policies/resourceAccess.ts

export type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";

export type MeLike = {
  // rôles/flags possibles (on accepte plusieurs formats pour être robuste)
  isAdmin?: boolean;
  isStaff?: boolean;
  role?: string;

  profileType?: string;

  isPremium?: boolean;
  premium?: boolean;

  entitlements?: {
    premium?: boolean;
  };
} | null | undefined;

export type ResourceLike = {
  accessLevel?: AccessLevel | string | null;

  // ✅ Gouvernance éditoriale "audit-proof"
  // draft / pending / approved / rejected
  status?: "draft" | "pending" | "approved" | "rejected" | string | null;
};

export function isBypassUser(me: MeLike): boolean {
  if (!me) return false;

  const role = (me as any).role;
  const profileType = (me as any).profileType;

  return (
    !!(me as any).isAdmin ||
    !!(me as any).isStaff ||
    role === "admin" ||
    role === "staff" ||
    profileType === "formateur"
  );
}

export function isPremiumUser(me: MeLike): boolean {
  if (!me) return false;
  return (
    !!(me as any).isPremium ||
    (me as any).premium === true ||
    (me as any).entitlements?.premium === true
  );
}

type CanonicalEntitlements = {
  isAuthenticated: boolean;
  isPremium: boolean;
  isStaff: boolean;
};

function buildEntitlements(me: MeLike): CanonicalEntitlements {
  return {
    isAuthenticated: !!me,
    isPremium: isPremiumUser(me),
    isStaff: isBypassUser(me),
  };
}

/**
 * Règle canonique "download/open"
 * - bypass staff/admin/formateur : OK
 * - PUBLIC : OK
 * - INTERNAL_IFAC : OK si connecté
 * - PREMIUM : OK si connecté ET premium
 */
export function canDownloadResource(args: { resource: ResourceLike; me: MeLike }): boolean {
  const { resource, me } = args;

  const ent = buildEntitlements(me);

  // ✅ Bypass staff/admin/formateur (règle métier)
  if (ent.isStaff) return true;

  const accessLevel = resource?.accessLevel as AccessLevel | undefined;
  const status = (resource as any)?.status as string | undefined;

  // ✅ Verrou "outil national" :
  // si pas approuvée => interdite au download pour tous les non-admin/staff
  // (évite qu’un brouillon soit téléchargeable via une URL directe)
  if (status && status !== "approved") {
    return false;
  }

  if (accessLevel === "PUBLIC") return true;
  if (accessLevel === "INTERNAL_IFAC") return ent.isAuthenticated;
  if (accessLevel === "PREMIUM") return ent.isAuthenticated && ent.isPremium;

  // Par défaut (valeur inconnue) : refus par sécurité
  return false;
}

