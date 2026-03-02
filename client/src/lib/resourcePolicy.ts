// client/src/lib/resourcePolicy.ts

/**
 * Centralise les règles métier “Ressource” côté UI.
 * - Labels (UI + CSV)
 * - Valeurs attendues / type-guards
 *
 * But : éviter les doublons dans les pages admin et garantir la cohérence.
 */

// ---- Access Level (Accès) ----
// On fige la “source de vérité” des valeurs attendues côté UI.
// Si demain le backend ajoute une valeur, on la voit ici immédiatement.
export const ACCESS_LEVELS = ["PUBLIC", "INTERNAL_IFAC", "PREMIUM"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export function isAccessLevel(v: unknown): v is AccessLevel {
  return typeof v === "string" && (ACCESS_LEVELS as readonly string[]).includes(v);
}

const ACCESS_LABEL: Record<AccessLevel, string> = {
  PUBLIC: "Public",
  INTERNAL_IFAC: "Connexion requise (ifac)",
  PREMIUM: "Premium",
};

export function accessLabel(value: unknown): string {
  if (!isAccessLevel(value)) return "—";
  return ACCESS_LABEL[value];
}

// ---- Visibility (Visibilité / publication) ----
// ⚠️ Ici on reste volontairement “agnostique” tant qu’on n’a pas figé les enums backend.
// On couvre les valeurs que tu utilises déjà + une tolérance propre.
export const VISIBILITY_LEVELS = ["PUBLIC", "INTERNAL_IFAC"] as const;
export type Visibility = (typeof VISIBILITY_LEVELS)[number];

export function isVisibility(v: unknown): v is Visibility {
  return typeof v === "string" && (VISIBILITY_LEVELS as readonly string[]).includes(v);
}

const VISIBILITY_LABEL: Record<Visibility, string> = {
  PUBLIC: "Visible sans connexion",
  INTERNAL_IFAC: "Connexion requise (IFAC)",
};

export function visibilityLabel(value: unknown): string {
  if (!isVisibility(value)) return "—";
  return VISIBILITY_LABEL[value];
}

// ---- Reading (Lecture) ----
// Lecture = résultat "réel" pour l'utilisateur : est-ce qu'il pourra ouvrir la ressource ?
// (On combine visibility + accessLevel dans une lecture humaine)
export type ReadingLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";

export function readingLabel(input: {
  visibility?: unknown;
  accessLevel?: unknown;
}): string {
  const access = String(input.accessLevel ?? "PUBLIC").toUpperCase();
  const vis = String(input.visibility ?? "PUBLIC").toUpperCase();

  if (access === "PREMIUM") return "Premium";
  if (access === "INTERNAL_IFAC" || vis === "INTERNAL_IFAC") return "Connexion requise (ifac)";
  return "Public";
}

export function readingBadgeClass(label: string): string {
  if (label === "Premium") return "bg-purple-50 text-purple-800";
  if (label === "Connexion requise (ifac)") return "bg-blue-50 text-blue-800";
  return "bg-green-50 text-green-800";
}
