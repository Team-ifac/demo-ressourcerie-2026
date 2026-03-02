// shared/resourceAccessPolicy.ts

export const VISIBILITY = ["PUBLIC", "INTERNAL_IFAC"] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const ACCESS_LEVEL = ["PUBLIC", "INTERNAL_IFAC", "PREMIUM"] as const;
export type AccessLevel = (typeof ACCESS_LEVEL)[number];

// “Entitlements” = ce que l’utilisateur a réellement comme droits
export type Entitlements = {
  isAuthenticated: boolean;
  isPremium: boolean;
  // réservé pour la suite (formateur/staff)
  isStaff?: boolean;
};

export function canViewResource(params: {
  visibility: Visibility;
  entitlements: Entitlements;
}): boolean {
  const { visibility, entitlements } = params;

  if (entitlements.isStaff) return true;

  if (visibility === "PUBLIC") return true;
  // INTERNAL_IFAC
  return entitlements.isAuthenticated;
}

export function canOpenResource(params: {
  accessLevel: AccessLevel;
  entitlements: Entitlements;
}): boolean {
  const { accessLevel, entitlements } = params;

  if (entitlements.isStaff) return true;

  if (accessLevel === "PUBLIC") return true;
  if (accessLevel === "INTERNAL_IFAC") return entitlements.isAuthenticated;
  // PREMIUM
  return entitlements.isAuthenticated && entitlements.isPremium;
}

// Optionnel : aide pour l’admin (cohérence)
export function isVisibilityAccessCoherent(params: {
  visibility: Visibility;
  accessLevel: AccessLevel;
}): boolean {
  const { visibility, accessLevel } = params;

  // Si c’est visible IFAC, mais accès PUBLIC : OK (rare mais possible)
  // Le seul cas “piégeux” = visible PUBLIC mais accès plus strict.
  if (visibility === "PUBLIC" && accessLevel !== "PUBLIC") return false;

  return true;
}
