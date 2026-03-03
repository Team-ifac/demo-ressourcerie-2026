import { and, desc, eq, inArray, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  users,
  themes,
  resources,
  resourceThemes,
  favorites,
  collectionResources,
  collections,
  userProfiles,
  formateurs,
  resourceProfiles,
  collectionProfiles,
  comments,
  resourceHistory,
  profileTypes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;
// =====================================================
// Helper : resolve profile key ("animateur", etc.) -> id
// =====================================================

async function resolveProfileTypeId(
  key: "animateur" | "formateur" | "directeur" | "stagiaire_bafa"
) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db
    .select({ id: profileTypes.id })
    .from(profileTypes)
    .where(eq(profileTypes.key, key))
    .limit(1);

  if (!result[0]) {
    throw new Error(`Profile type not found for key: ${key}`);
  }

  return result[0].id;
}

async function getProfileTypeIdMap() {
  const db = await getDb();

  const rows = await db
    .select({ id: profileTypes.id, key: profileTypes.key })
    .from(profileTypes);

  const map = new Map<string, number>();
  for (const r of rows) map.set(r.key, r.id);

  return map;
}

export async function getUserEntitlements(userId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) {
    return null;
  }

  const result = await dbInstance
    .select({
      userId: sql<number>`user_entitlements.userId`,
      premium: sql<number>`user_entitlements.premium`,
      premiumSince: sql<any>`user_entitlements.premiumSince`,
      premiumUntil: sql<any>`user_entitlements.premiumUntil`,
    })
    .from(sql`user_entitlements`)
    .where(sql`user_entitlements.userId = ${userId}`)
    .limit(1);

  return result?.[0] ?? null;
}

export async function setUserPremium(userId: number, premium: boolean) {
  const dbInstance = await getDb();
  if (!dbInstance) return;

  // 1) Override persistant côté users (admin-friendly, sans Stripe)
  await dbInstance.execute(sql`
    UPDATE users
    SET premiumOverride = ${premium ? 1 : 0}
    WHERE id = ${userId}
  `);

  // 2) On conserve l’historique/entitlements (architecture “pro”)
  await dbInstance.execute(sql`
    INSERT INTO user_entitlements (userId, premium, premiumSince, premiumUntil)
    VALUES (
      ${userId},
      ${premium ? 1 : 0},
      ${premium ? sql`NOW()` : null},
      ${premium ? null : sql`NOW()`}
    )
    ON DUPLICATE KEY UPDATE
      premium = VALUES(premium),
      premiumSince = CASE
        WHEN VALUES(premium) = 1 THEN COALESCE(user_entitlements.premiumSince, NOW())
        ELSE NULL
      END,
      premiumUntil = CASE
        WHEN VALUES(premium) = 0 THEN NOW()
        ELSE NULL
      END
  `);
}

export async function getDb() {
  if (_db) {
    return _db;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error("[Database] DATABASE_URL is not set");
  }

  try {
    _db = drizzle(process.env.DATABASE_URL);
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    throw error;
  }
}

// ============ PATH NORMALIZATION (PILIER 1) ============
// Objectif : 1 règle canonique pour dériver les vignettes à partir des PDF importés.
// On garde ça ici (serveur) pour pouvoir l'utiliser depuis import, upload, admin, etc.

function normalizeFileName(input: string): string {
  const base = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .toLowerCase()
    .replace(/['’]/g, "") // supprime apostrophes
    .replace(/[^a-z0-9.]+/g, "-") // tirets
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  const truncated = base.slice(0, 120);
  return truncated || "fichier";
}

function withPngExtension(filename: string): string {
  const lower = (filename ?? "").toLowerCase();
  if (lower.endsWith(".pdf")) return filename.slice(0, -4) + ".png";
  if (lower.endsWith(".png")) return filename;
  return filename + ".png";
}

/**
 * Dérive une vignette canonique à partir d'un fileUrl PDF importé.
 *
 * Exemple:
 *  fileUrl:      /imported/formateur/INTERNAL_IFAC/ma-categorie/mon-doc.pdf
 *  thumbnailUrl: /imported_thumbs/formateur/INTERNAL_IFAC/ma-categorie/mon-doc.png
 *
 * Règles:
 * - On remplace uniquement le préfixe /imported -> /imported_thumbs
 * - On normalise le NOM de fichier (dernier segment) via normalizeFileName()
 * - On force l'extension en .png
 */
export function deriveImportedThumbnailUrl(fileUrl: string | null | undefined): string | null {
  const raw = (fileUrl ?? "").trim();
  if (!raw) return null;

  // On ne gère ici que les ressources importées (Option B / public/imported)
  if (!raw.startsWith("/imported/")) return null;

  // IMPORTANT: fileUrl est une URL (segments encodés). On décode AVANT normalisation.
  const urlParts = raw.split("/").filter(Boolean); // ["imported","...","Mon%20doc.pdf"]
  if (urlParts.length < 2) return null;

  const decodedParts = urlParts.map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p; // fallback safe
    }
  });

  const decodedFilename = decodedParts[decodedParts.length - 1] ?? "";
  const normalizedFilename = withPngExtension(normalizeFileName(decodedFilename));

  // On reconstruit l'URL canonique: mêmes dossiers, base remplacée + filename normalisé.
  const thumbDecodedParts = [...decodedParts];
  thumbDecodedParts[0] = "imported_thumbs";
  thumbDecodedParts[thumbDecodedParts.length - 1] = normalizedFilename;

  // On ré-encode chaque segment pour une URL propre
  const encoded = thumbDecodedParts.map((p) => encodeURIComponent(p));
  return "/" + encoded.join("/");
}

// ============ USER HELPERS ============

export async function upsertUser(user: any): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: any = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

// ============ THEME HELPERS ============

export async function getAllThemes() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(themes).orderBy(themes.name);
}

export async function getThemeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(themes).where(eq(themes.id, id)).limit(1);
  return result[0];
}

export async function createTheme(theme: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(themes).values(theme);
  return Number((result as any).insertId);
}

export async function updateTheme(id: number, theme: Partial<any>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(themes).set(theme).where(eq(themes.id, id));
}

export async function deleteTheme(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(themes).where(eq(themes.id, id));
}

// ============ RESOURCE HELPERS ============

// 🔒 Token interne pour activer la vue admin dans getAllResources (impossible à forger via JSON)
export const ADMIN_VIEW_TOKEN = Symbol("ADMIN_VIEW_TOKEN");

export async function getAllResources(filters?: {
  search?: string;
  themeIds?: number[];
  collectionIds?: number[];
  type?: string;
  ageRange?: string;
  duration?: string;
  visibility?: "PUBLIC" | "INTERNAL_IFAC";
  includeInternal?: boolean;
  includePremium?: boolean;
  category?: string;
  profileType?: "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

  // ✅ vue admin = ne pas filtrer par accessLevel/status
  // 🔒 SÉCURITÉ (outil national) : pas de boolean, uniquement token interne
  adminView?: symbol;
}) {
  const db = await getDb();
  if (!db) return [];

  const debugSql = process.env.DEBUG_SQL === "true";

  if (debugSql) {
    console.log(
      "[DEBUG][getAllResources] filters =",
      JSON.stringify(filters, null, 2)
    );
  }

  // 🔒 La vue admin n’est active QUE si on passe le token interne.
  const isAdminView = filters?.adminView === ADMIN_VIEW_TOKEN;

  const conditions: any[] = [];

  if (filters?.search) {
    conditions.push(
      or(
        like(resources.title, `%${filters.search}%`),
        like(resources.summary, `%${filters.search}%`),
        like(resources.content, `%${filters.search}%`)
      )
    );
  }

  if (filters?.type) conditions.push(eq(resources.type, filters.type));
  if (filters?.ageRange) conditions.push(eq(resources.ageRange, filters.ageRange));
  if (filters?.duration) conditions.push(eq(resources.duration, filters.duration));

  // ===== Visibility =====
  if (filters?.visibility) {
    conditions.push(eq(resources.visibility, filters.visibility));
  } else if (!filters?.includeInternal) {
    // public: uniquement PUBLIC
    conditions.push(eq(resources.visibility, "PUBLIC"));
  }
  // includeInternal = true : PUBLIC + INTERNAL_IFAC

  // ===== Category (Phase 1) =====
  // category est désormais une clé string canonique => filtre exact ok
  if (filters?.category) {
    if (debugSql) console.log("[DEBUG] Adding category filter:", filters.category);
    conditions.push(eq(resources.category, filters.category));
  }

  // ===== Access level (SAFE-BY-DEFAULT — plateforme nationale) =====
  // Objectif :
  // - Public (non connecté) : on ne liste que PUBLIC
  // - Connecté (includeInternal=true) : on liste PUBLIC + INTERNAL_IFAC
  // - Admin (adminView token) : pas de filtre
  //
  // IMPORTANT : par défaut, on n'expose jamais PREMIUM via ce listing "standard".
  // Le listing PREMIUM doit être demandé explicitement (includePremium=true) après décision tRPC + entitlements.
  if (!isAdminView) {
    // ✅ Compat legacy : AUTHENTICATED = ancien label de INTERNAL_IFAC
    // On le traite comme INTERNAL_IFAC pour ne pas casser les vieux contenus / fixtures de tests.
    const internalOrLegacyAuthenticated = or(
      eq(resources.accessLevel, "INTERNAL_IFAC"),
      eq(resources.accessLevel as any, "AUTHENTICATED" as any)
    );

    if (!filters?.includeInternal) {
      conditions.push(eq(resources.accessLevel, "PUBLIC"));
    } else if (filters?.includePremium) {
      conditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          internalOrLegacyAuthenticated,
          eq(resources.accessLevel, "PREMIUM")
        )
      );
    } else {
      conditions.push(or(eq(resources.accessLevel, "PUBLIC"), internalOrLegacyAuthenticated));
    }
  }

  // ===== Status (GOUVERNANCE — PILIER 9) =====
  // Règle canonique :
  // - Non-admin (public ou connecté) : uniquement les ressources publiées
  // - Admin (adminView token) : tout (draft + approved)
  if (!isAdminView) {
    conditions.push(eq(resources.status, "approved"));
  }

  if (debugSql) console.log("[DEBUG] Total conditions:", conditions.length);

  let query: any = db.select().from(resources);

  if (filters?.profileType) {
    const profileTypeId = await resolveProfileTypeId(filters.profileType);

    query = query
      .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
      .where(
        and(
          eq(resourceProfiles.profileTypeId, profileTypeId),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );
  } else if (filters?.collectionIds && filters.collectionIds.length > 0) {
    query = query
      .innerJoin(collectionResources, eq(resources.id, collectionResources.resourceId))
      .where(
        and(
          inArray(collectionResources.collectionId, filters.collectionIds),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );
  } else if (filters?.themeIds && filters.themeIds.length > 0) {
    query = query
      .innerJoin(resourceThemes, eq(resources.id, resourceThemes.resourceId))
      .where(
        and(
          inArray(resourceThemes.themeId, filters.themeIds),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );
  } else if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  // ✅ PRO: plus récent d’abord (meilleure lisibilité + démo)
  const result = await query.orderBy(desc(resources.createdAt));

  // Extract only resource data if joined and deduplicate
  const resourcesMap = new Map<number, any>();
  result.forEach((row: any) => {
    const resource = row.resources || row;
    if (!resourcesMap.has(resource.id)) {
      resourcesMap.set(resource.id, resource);
    }
  });

  // Récupérer les collections associées à chaque ressource
  const resourcesWithCollections = await Promise.all(
    Array.from(resourcesMap.values()).map(async (resource: any) => {
      const collectionRows = await db
        .select()
        .from(collectionResources)
        .innerJoin(collections, eq(collectionResources.collectionId, collections.id))
        .where(eq(collectionResources.resourceId, resource.id));

      return {
        ...resource,
        collections: collectionRows.map((row: any) => row.collections),
      };
    })
  );

  return resourcesWithCollections;
}

export async function getRecentResources(limit: number, includeInternal: boolean) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  // 🔒 Gouvernance (audit-proof) : jamais de non-publié dans les listes "publiques"
  conditions.push(eq(resources.status, "approved"));

  if (!includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else {
    conditions.push(
      or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "INTERNAL_IFAC"))
    );
  }

  let query: any = db.select().from(resources);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.orderBy(desc(resources.createdAt)).limit(limit);

  return result;
}

export async function getPopularResources(
  limit: number,
  includeInternal: boolean,
  includePremium: boolean = false
) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  // 🔒 Gouvernance (audit-proof) : jamais de non-publié dans les listes "publiques"
  conditions.push(eq(resources.status, "approved"));

  if (!includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else if (includePremium) {
    conditions.push(
      or(
        eq(resources.accessLevel, "PUBLIC"),
        eq(resources.accessLevel, "INTERNAL_IFAC"),
        eq(resources.accessLevel, "PREMIUM")
      )
    );
  } else {
    conditions.push(
      or(
        eq(resources.accessLevel, "PUBLIC"),
        eq(resources.accessLevel, "INTERNAL_IFAC")
      )
    );
  }

  let query: any = db.select().from(resources);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.orderBy(desc(resources.viewCount)).limit(limit);

  return result;
}

// ===================== HOME POPULAR (6 auto + 2 éditoriales) =====================
//
// L’admin pilote 2 ressources via une collection dédiée.
// Le reste (6) vient des plus vues (viewCount DESC), sans doublon.
const HOME_EDITORIAL_COLLECTION_NAME = "Accueil - Sélection éditoriale";

export async function getHomePopularResources(params: {
  includeInternal: boolean; // ctx.user connecté ?
  includePremium?: boolean; // premium ? (entitlements)
  isAdmin: boolean; // ctx.user.role === 'admin' ?
  autoLimit?: number; // défaut 6
  editorialLimit?: number; // défaut 2
}) {
  const db = await getDb();
  if (!db) return [];

  const autoLimit = params.autoLimit ?? 6;
  const editorialLimit = params.editorialLimit ?? 2;

  const baseConditions: any[] = [];

  // ✅ Règle canonique (outil national) :
  // - Admin : voit TOUT (aucun filtre accessLevel/visibility/status ici)
  // - Non-admin : SAFE-BY-DEFAULT (PUBLIC / INTERNAL_IFAC / PREMIUM selon flags)
  if (!params.isAdmin) {
    // Accès visibilité / accessLevel (SAFE-BY-DEFAULT)
    if (!params.includeInternal) {
      baseConditions.push(eq(resources.visibility, "PUBLIC"));
      baseConditions.push(eq(resources.accessLevel, "PUBLIC"));
    } else if (params.includePremium) {
      baseConditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          eq(resources.accessLevel, "INTERNAL_IFAC"),
          eq(resources.accessLevel, "PREMIUM")
        )
      );
    } else {
      baseConditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          eq(resources.accessLevel, "INTERNAL_IFAC")
        )
      );
    }

    // On évite d’exposer des drafts aux non-admin sur la home
    baseConditions.push(eq(resources.status, "approved"));
  }

  // 1) Éditorial (max 2) via collection dédiée
  const editorialRows = await db
    .select({ resource: resources })
    .from(collectionResources)
    .innerJoin(collections, eq(collectionResources.collectionId, collections.id))
    .innerJoin(resources, eq(collectionResources.resourceId, resources.id))
    .where(
      and(
        eq(collections.name, HOME_EDITORIAL_COLLECTION_NAME),
        baseConditions.length > 0 ? and(...baseConditions) : undefined
      )
    )
    .orderBy(desc(collectionResources.addedAt))
    .limit(editorialLimit);

  const editorialResources = editorialRows.map((r: any) => r.resource);
  const editorialIds = new Set<number>(editorialResources.map((r: any) => Number(r.id)));

  // 2) Automatique : top vues, en excluant les éditoriales
  const autoRows = await db
    .select()
    .from(resources)
    .where(baseConditions.length > 0 ? and(...baseConditions) : undefined)
    // ✅ Si includePremium=true, on “pousse” les PREMIUM en haut (sans fuite car baseConditions filtre déjà)
    .orderBy(
      desc(sql`(${resources.accessLevel} = 'PREMIUM')`),
      desc(resources.viewCount),
      desc(resources.createdAt)
    )
    .limit(autoLimit + editorialLimit + 10);

  const autoResources = autoRows
    .filter((r: any) => !editorialIds.has(Number(r.id)))
    // ✅ Priorité forte PREMIUM côté JS (fiable, indépendant du SQL)
    .sort((a: any, b: any) => {
      if (a.accessLevel === "PREMIUM" && b.accessLevel !== "PREMIUM") return -1;
      if (b.accessLevel === "PREMIUM" && a.accessLevel !== "PREMIUM") return 1;
      return 0;
    })
    .slice(0, autoLimit);

  // 3) Résultat final (max 8)
  return [...editorialResources, ...autoResources].slice(0, editorialLimit + autoLimit);
}

export async function getResourceById(
  id: number,
  options?: {
    includeInternal?: boolean;
    includePremium?: boolean;
    isAdmin?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return undefined;

  const includeInternal = options?.includeInternal ?? false;
  const includePremium = options?.includePremium ?? false;
  const isAdmin = options?.isAdmin ?? false;

  const conditions: any[] = [eq(resources.id, id)];

  // 🔒 SAFE-BY-DEFAULT (outil national)
  if (!isAdmin) {
    // Access level
    if (!includeInternal) {
      conditions.push(eq(resources.accessLevel, "PUBLIC"));
    } else if (includePremium) {
      conditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          eq(resources.accessLevel, "INTERNAL_IFAC"),
          eq(resources.accessLevel, "PREMIUM")
        )
      );
    } else {
      conditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          eq(resources.accessLevel, "INTERNAL_IFAC")
        )
      );
    }

    // Gouvernance : jamais de non publié
    conditions.push(eq(resources.status, "approved"));
  }

  const result = await db
    .select()
    .from(resources)
    .where(and(...conditions))
    .limit(1);

  return result[0];
}

export async function getResourceThemes(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ theme: themes })
    .from(resourceThemes)
    .innerJoin(themes, eq(resourceThemes.themeId, themes.id))
    .where(eq(resourceThemes.resourceId, resourceId));

  return result.map((r) => r.theme);
}

export async function createResource(resource: any, themeIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ✅ Defaults canonique côté serveur (évite draft+PUBLIC quand l'UI ne propose pas ces champs)
  // - statut par défaut : draft
  // - visibilité par défaut : INTERNAL_IFAC
  const safeResource = {
    ...resource,
    status: resource?.status ?? "draft",
    visibility: resource?.visibility ?? "INTERNAL_IFAC",
  };

  // ✅ Blindage DB (Pilier 10) : interdit draft + PUBLIC
  // On applique une règle canonique même si un autre endpoint/import contourne l’UI.
  const nextStatus = String(safeResource?.status ?? "draft").toLowerCase();
  const nextVisibility = String(safeResource?.visibility ?? "INTERNAL_IFAC").toUpperCase();

  if (nextStatus !== "approved" && nextVisibility === "PUBLIC") {
    throw new Error(
      "Interdit : une ressource non publiée (draft/pending/rejected) ne peut pas être publique (PUBLIC)."
    );
  }

  const [result] = await db.insert(resources).values(safeResource);
  const resourceId = Number((result as any).insertId);

  if (themeIds.length > 0) {
    await db.insert(resourceThemes).values(
      themeIds.map((themeId) => ({ resourceId, themeId }))
    );
  }

  return resourceId;
}

export async function updateResource(id: number, resource: Partial<any>, themeIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // IMPORTANT : update partiel => on merge avec l’existant pour valider l’état final.
  const existing = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  const current = (existing?.[0] ?? {}) as any;
  
  // =========================================================
  // 🔒 GARDE-FOU COHÉRENCE (audit-proof)
  // accessLevel = champ canonique
  // visibility = miroir legacy strict :
  //   - PUBLIC -> PUBLIC
  //   - INTERNAL_IFAC/PREMIUM -> INTERNAL_IFAC
  // =========================================================
  const patch: any = { ...(resource as any) };

  // =========================================================
  // 🏛 PILIER 4 — Revalidation automatique (correcte)
  // Objectif :
  // - Si une ressource est "approved" et qu'on modifie autre chose que le statut,
  //   alors elle repasse en "pending".
  // - Exception : si l'appel demande EXPLICITEMENT un changement de statut
  //   (ex: pending -> approved), on respecte la demande.
  // =========================================================
  const statutActuel = String(current?.status ?? "draft").toLowerCase();
  const statutDemandeBrut = patch?.status;
  const statutDemande =
    statutDemandeBrut !== undefined ? String(statutDemandeBrut).toLowerCase() : undefined;

  // Vrai si on modifie au moins un champ autre que "status"
  const modificationAutreQueStatut = Object.keys(patch).some((cle) => cle !== "status");

  // Vrai si on a demandé explicitement un changement de statut (et pas juste "status" remis tel quel)
  const changementStatutExplicite =
    statutDemande !== undefined && statutDemande !== statutActuel;

  if (
    statutActuel === "approved" &&
    modificationAutreQueStatut &&
    !changementStatutExplicite
  ) {
    patch.status = "pending";
  }

  const nextAccessLevel = String(
    patch?.accessLevel ?? current?.accessLevel ?? "PUBLIC"
  ).toUpperCase();

  const canonicalVisibility =
    nextAccessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

  const hasVisibilityInPatch = patch.visibility !== undefined;
  const hasAccessLevelInPatch = patch.accessLevel !== undefined;

  // 1) Si accessLevel change et visibility n'est pas fourni => on complète automatiquement
  if (hasAccessLevelInPatch && !hasVisibilityInPatch) {
    patch.visibility = canonicalVisibility;
  }

  // 2) Si visibility est fourni mais incohérent avec accessLevel final => on force + warning
  if (hasVisibilityInPatch) {
    const requestedVisibility = String(patch.visibility ?? "").toUpperCase();
    if (requestedVisibility !== canonicalVisibility) {
      console.warn(
        "[updateResource] visibility/accessLevel incohérent -> visibility forcée",
        {
          id,
          requestedVisibility,
          accessLevel: nextAccessLevel,
          forcedVisibility: canonicalVisibility,
        }
      );
      patch.visibility = canonicalVisibility;
    }
  }

  // =========================================================
  // ✅ Blindage DB (Pilier 10) : interdit draft + PUBLIC
  // On valide sur l'état FINAL (patch + existant + garde-fou)
  // =========================================================
  // =========================================================
  // 🔐 PILIER 4 — Verrouillage des transitions de statut
  // Transitions autorisées :
  // draft -> pending
  // pending -> approved
  // pending -> rejected
  // rejected -> draft
  // =========================================================

  // ✅ Option 2 (validée) : Admin tout-puissant
  // - Si l'update vient d'un admin, on autorise toutes les transitions.
  // - Sinon, on garde le verrouillage strict.
  const isAdmin = String((patch as any)?._actorRole ?? "").toLowerCase() === "admin";

  // ✅ On retire le champ technique avant update DB (ne doit JAMAIS finir en base)
  if ((patch as any)?._actorRole !== undefined) {
    delete (patch as any)._actorRole;
  }

  const previousStatusStrict = String(current?.status ?? "draft").toLowerCase();
  const nextStatus = String(patch?.status ?? current?.status ?? "draft").toLowerCase();

  const allowedTransitions: Record<string, string[]> = {
    draft: ["pending"],
    pending: ["approved", "rejected"],
    approved: ["pending"], // modification automatique déjà gérée plus haut
    rejected: ["draft"],
  };

  if (patch?.status !== undefined && previousStatusStrict !== nextStatus) {
    if (!isAdmin) {
      const allowed = allowedTransitions[previousStatusStrict] || [];
      if (!allowed.includes(nextStatus)) {
        throw new Error(`Transition interdite: ${previousStatusStrict} -> ${nextStatus}`);
      }
    } else {
      console.warn("[updateResource] admin override transition", {
        id,
        from: previousStatusStrict,
        to: nextStatus,
      });
    }
  }


  const nextVisibility = String(patch?.visibility ?? current?.visibility ?? "PUBLIC").toUpperCase();

  if (nextStatus !== "approved" && nextVisibility === "PUBLIC") {
    throw new Error(
      "Interdit : une ressource non publiée (draft/pending/rejected) ne peut pas être publique (PUBLIC)."
    );
  }

  await db.update(resources).set(patch).where(eq(resources.id, id));
  // =========================================================
  // 🧾 PILIER 4 — Journalisation automatique des changements de statut
  // =========================================================
  const finalStatus = String(patch?.status ?? current?.status ?? "").toLowerCase();
  const previousStatus = String(current?.status ?? "").toLowerCase();

  if (finalStatus && previousStatus && finalStatus !== previousStatus) {
    try {
      await addResourceHistory({
        resourceId: id,
        userId: null, // on améliorera plus tard avec l'actor réel
        action: "STATUS_CHANGE",
        changes: JSON.stringify({
          from: previousStatus,
          to: finalStatus,
        }),
      });
    } catch (err) {
      console.warn("⚠️ resource_history insert failed (status change):", err);
    }
  }

  if (themeIds !== undefined) {
    await db.delete(resourceThemes).where(eq(resourceThemes.resourceId, id));
    if (themeIds.length > 0) {
      await db.insert(resourceThemes).values(
        themeIds.map((themeId) => ({ resourceId: id, themeId }))
      );
    }
  }
}

export async function deleteResource(id: number, actorUserId: number) {
  console.log("🔥 deleteResource appelé avec id =", id, "actorUserId =", actorUserId);

  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  // 1) On récupère la ressource AVANT suppression (pour connaître fileUrl / thumbnailUrl)
  const existing = await dbInstance
    .select()
    .from(resources)
    .where(eq(resources.id, id))
    .limit(1);

  if (!existing[0]) return;

  const resource = existing[0] as any;
  const fileUrl = (resource.fileUrl as string | null) ?? null;
  const thumbnailUrl = (resource.thumbnailUrl as string | null) ?? null;

  // ✅ actorUserId doit être un int > 0 (audit trail fiable)
  if (!Number.isInteger(actorUserId) || actorUserId <= 0) {
    throw new Error(
      `[deleteResource] actorUserId invalide (reçu: ${String(actorUserId)})`
    );
  }
  const safeActorUserId = actorUserId;

  // 2bis) AUDIT LOG (PILIER 14) — on trace la suppression
  // NOTE: on log AVANT la suppression DB pour garder le snapshot.
  try {
    const changes = JSON.stringify(
      {
        title: resource.title ?? null,
        fileUrl,
        thumbnailUrl,
        accessLevel: resource.accessLevel ?? null,
        visibility: resource.visibility ?? null,
        status: resource.status ?? null,
      },
      null,
      2
    );

    await addResourceHistory({
      resourceId: id,
      userId: safeActorUserId,
      action: "DELETE_RESOURCE",
      changes,
    });
  } catch (err) {
    console.warn("⚠️ resource_history insert failed (delete):", err);
  }

  // 2) Suppression DB (FK cascade supprime les liens taxonomy etc.)
  await dbInstance.delete(resources).where(eq(resources.id, id));

  // 3) Suppression disque (PDF + vignette) — seulement si ce sont des fichiers "imported"
  try {
    const pathMod = await import("node:path");
    const fsMod = await import("node:fs");

    const path = pathMod.default ?? pathMod;
    const fs = fsMod.default ?? fsMod;

    // ✅ FIX: ne pas dépendre de process.cwd()
    const { fileURLToPath } = await import("node:url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirnameResolved = path.dirname(__filename);

    const projectRoot = path.resolve(__dirnameResolved, "..");

    const safeAbsFromPublicUrl = (url: string): string | null => {
      const raw = (url ?? "").trim();
      if (!raw.startsWith("/")) return null;

      const rel = raw.replace(/^\/+/, "");
      if (rel.includes("..")) return null;

      const publicRoot = path.join(projectRoot, "client", "public");
      const abs = path.join(publicRoot, rel);

      const absNorm = path.normalize(abs);
      const publicNorm = path.normalize(publicRoot);
      if (!absNorm.startsWith(publicNorm)) return null;

      return absNorm;
    };

    // PDF importé
    if (fileUrl && fileUrl.startsWith("/imported/")) {
      const pdfAbs = safeAbsFromPublicUrl(fileUrl);
      console.log("DEBUG deleteResource pdfAbs =", pdfAbs);

      if (pdfAbs && fs.existsSync(pdfAbs)) {
        fs.unlinkSync(pdfAbs);
        console.log("🗑️ PDF supprimé:", pdfAbs);
      } else {
        console.log("⚠️ PDF introuvable:", pdfAbs);
      }
    }

    // Thumbnail importée (priorité : thumbnailUrl DB, sinon dérivation)
    const thumbCandidate =
      (thumbnailUrl && thumbnailUrl.startsWith("/imported_thumbs/")
        ? thumbnailUrl
        : null) ??
      (fileUrl ? deriveImportedThumbnailUrl(fileUrl) : null);

    if (thumbCandidate && thumbCandidate.startsWith("/imported_thumbs/")) {
      const thumbAbs = safeAbsFromPublicUrl(thumbCandidate);
      console.log("DEBUG deleteResource thumbAbs =", thumbAbs);

      if (thumbAbs && fs.existsSync(thumbAbs)) {
        fs.unlinkSync(thumbAbs);
        console.log("🗑️ Thumbnail supprimée:", thumbAbs);
      } else {
        console.log("⚠️ Thumbnail introuvable:", thumbAbs);
      }
    }
  } catch (err) {
    console.warn("⚠️ Erreur suppression disque:", err);
  }
}

// ============ FAVORITE HELPERS ============

export async function getUserFavorites(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ resource: resources })
    .from(favorites)
    .innerJoin(resources, eq(favorites.resourceId, resources.id))
    .where(eq(favorites.userId, userId))
    .orderBy(favorites.createdAt);

  return result.map((r) => r.resource);
}

export async function isFavorite(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) return false;

  const result = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.resourceId, resourceId)))
    .limit(1);

  return result.length > 0;
}

export async function addFavorite(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  try {
    await db.insert(favorites).values({ userId, resourceId });
  } catch (error: any) {
    if (error.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }
}

export async function removeFavorite(userId: number, resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(favorites).where(and(eq(favorites.userId, userId), eq(favorites.resourceId, resourceId)));
}

// ============ TAG HELPERS ============

export async function getAllTags() {
  const db = await getDb();
  if (!db) return [];

  const { tags } = await import("../drizzle/schema");
  return await db.select().from(tags).orderBy(tags.name);
}

export async function getTagById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { tags } = await import("../drizzle/schema");
  const result = await db.select().from(tags).where(eq(tags.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createTag(data: { name: string; slug: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags } = await import("../drizzle/schema");
  const [result] = await db.insert(tags).values({
    name: data.name,
    slug: data.slug,
  });
  return Number((result as any).insertId);
}

export async function updateTag(id: number, data: { name?: string; slug?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags } = await import("../drizzle/schema");
  await db.update(tags).set(data).where(eq(tags.id, id));
}

export async function deleteTag(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { tags, resourceTags } = await import("../drizzle/schema");

  await db.delete(resourceTags).where(eq(resourceTags.tagId, id));
  await db.delete(tags).where(eq(tags.id, id));
}

export async function getResourceTags(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const { tags, resourceTags } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
    })
    .from(resourceTags)
    .innerJoin(tags, eq(resourceTags.tagId, tags.id))
    .where(eq(resourceTags.resourceId, resourceId));

  return result;
}

export async function addResourceTag(resourceId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { resourceTags } = await import("../drizzle/schema");

  await db
    .insert(resourceTags)
    .values({
      resourceId,
      tagId,
    })
    .onDuplicateKeyUpdate({
      set: { resourceId, tagId }, // no-op
    });
}

export async function removeResourceTag(resourceId: number, tagId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { resourceTags } = await import("../drizzle/schema");

  await db
    .delete(resourceTags)
    .where(and(eq(resourceTags.resourceId, resourceId), eq(resourceTags.tagId, tagId)));
}

export async function setResourceTags(resourceId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { resourceTags } = await import("../drizzle/schema");

  await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId));

  if (tagIds.length > 0) {
    await db.insert(resourceTags).values(tagIds.map((tagId) => ({ resourceId, tagId })));
  }
}

// ============ COLLECTION HELPERS ============

export async function getUserCollections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { collections } = await import("../drizzle/schema");

  return await db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(desc(collections.createdAt));
}

export async function getAllCollections() {
  const db = await getDb();
  if (!db) return [];

  const { collections } = await import("../drizzle/schema");

  return await db.select().from(collections).orderBy(desc(collections.createdAt));
}

export async function getCollectionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { collections } = await import("../drizzle/schema");
  const result = await db.select().from(collections).where(eq(collections.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createCollection(data: {
  userId: number;
  name: string;
  slug: string;
  description?: string;
  accessLevel: "PUBLIC" | "INTERNAL_IFAC";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collections } = await import("../drizzle/schema");

  const [result] = await db.insert(collections).values({
    userId: data.userId,
    name: data.name,
    slug: data.slug,
    description: data.description || undefined,
    accessLevel: data.accessLevel ?? "INTERNAL_IFAC",
  });

  return Number((result as any).insertId);
}

export async function updateCollection(
  id: number,
  data: {
    name?: string;
    description?: string;
    isPublic?: boolean;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collections } = await import("../drizzle/schema");
  const updateData: any = { ...data };
  if (data.isPublic !== undefined) {
    updateData.isPublic = data.isPublic ? "true" : "false";
  }
  await db.update(collections).set(updateData).where(eq(collections.id, id));
}

export async function deleteCollection(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collections, collectionResources } = await import("../drizzle/schema");

  await db.delete(collectionResources).where(eq(collectionResources.collectionId, id));
  await db.delete(collections).where(eq(collections.id, id));
}

export async function getCollectionResources(
  collectionId: number,
  options?: {
    includeInternal?: boolean;
    includePremium?: boolean;
    isAdmin?: boolean;
  }
) {
  const db = await getDb();
  if (!db) return [];

  const { resources: resourcesTable, collectionResources } = await import("../drizzle/schema");

  const includeInternal = options?.includeInternal ?? false;
  const includePremium = options?.includePremium ?? false;
  const isAdmin = options?.isAdmin ?? false;

  const conditions: any[] = [eq(collectionResources.collectionId, collectionId)];

  // 🔐 SAFE-BY-DEFAULT (comme getAllResources)

  if (!isAdmin) {
    if (!includeInternal) {
      conditions.push(eq(resourcesTable.accessLevel, "PUBLIC"));
    } else if (includePremium) {
      conditions.push(
        or(
          eq(resourcesTable.accessLevel, "PUBLIC"),
          eq(resourcesTable.accessLevel, "INTERNAL_IFAC"),
          eq(resourcesTable.accessLevel, "PREMIUM")
        )
      );
    } else {
      conditions.push(
        or(
          eq(resourcesTable.accessLevel, "PUBLIC"),
          eq(resourcesTable.accessLevel, "INTERNAL_IFAC")
        )
      );
    }

    // 🔒 Ne jamais exposer draft/pending/rejected
    conditions.push(eq(resourcesTable.status, "approved"));
  }

  const result = await db
    .select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      summary: resourcesTable.summary,
      type: resourcesTable.type,
      ageRange: resourcesTable.ageRange,
      duration: resourcesTable.duration,
      visibility: resourcesTable.visibility,
      accessLevel: resourcesTable.accessLevel,
      thumbnailUrl: resourcesTable.thumbnailUrl,
      createdAt: resourcesTable.createdAt,
      addedAt: collectionResources.addedAt,
    })
    .from(collectionResources)
    .innerJoin(resourcesTable, eq(collectionResources.resourceId, resourcesTable.id))
    .where(and(...conditions))
    .orderBy(desc(collectionResources.addedAt));

  return result;
}

export async function addResourceToCollection(collectionId: number, resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collectionResources } = await import("../drizzle/schema");

  await db
    .insert(collectionResources)
    .values({
      collectionId,
      resourceId,
      addedAt: new Date().toISOString(),
    })
    .onDuplicateKeyUpdate({
      set: { collectionId, resourceId }, // no-op
    });
}

export async function removeResourceFromCollection(collectionId: number, resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collectionResources } = await import("../drizzle/schema");

  await db
    .delete(collectionResources)
    .where(and(eq(collectionResources.collectionId, collectionId), eq(collectionResources.resourceId, resourceId)));
}

export async function isResourceInCollection(collectionId: number, resourceId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const { collectionResources } = await import("../drizzle/schema");

  const result = await db
    .select()
    .from(collectionResources)
    .where(and(eq(collectionResources.collectionId, collectionId), eq(collectionResources.resourceId, resourceId)))
    .limit(1);

  return result.length > 0;
}

// ============ COMMENT HELPERS ============

export async function getResourceComments(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const { comments, users: usersTable } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      rating: comments.rating,
      createdAt: comments.createdAt,
      updatedAt: comments.updatedAt,
      userId: comments.userId,
      userName: usersTable.name,
    })
    .from(comments)
    .innerJoin(usersTable, eq(comments.userId, usersTable.id))
    .where(eq(comments.resourceId, resourceId))
    .orderBy(desc(comments.createdAt));

  return result;
}

export async function getCommentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const { comments } = await import("../drizzle/schema");
  const result = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createComment(data: { resourceId: number; userId: number; content: string; rating?: number; hasTested?: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { comments } = await import("../drizzle/schema");

  const [result] = await db.insert(comments).values({
    resourceId: data.resourceId,
    userId: data.userId,
    content: data.content,
    rating: data.rating || undefined,
    hasTested: (data.hasTested ? "true" : "false") as any,
  });

  return Number((result as any).insertId);
}

export async function updateComment(
  id: number,
  data: { content?: string; rating?: number }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // ✅ No-op si rien à mettre à jour
  const patch: any = {};
  if (data.content !== undefined) patch.content = data.content;
  if (data.rating !== undefined) patch.rating = data.rating;

  if (Object.keys(patch).length === 0) return;

  // ✅ Source de vérité DB (timezone/format gérés par MySQL)
  patch.updatedAt = sql`NOW()`;

  await db.update(comments).set(patch).where(eq(comments.id, id));
}

export async function deleteComment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { comments } = await import("../drizzle/schema");
  await db.delete(comments).where(eq(comments.id, id));
}

export async function getUserComments(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const { comments, resources: resourcesTable } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: comments.id,
      content: comments.content,
      rating: comments.rating,
      createdAt: comments.createdAt,
      resourceId: comments.resourceId,
      resourceTitle: resourcesTable.title,
    })
    .from(comments)
    .innerJoin(resourcesTable, eq(comments.resourceId, resourcesTable.id))
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt));

  return result;
}

// ============ RESOURCE HISTORY HELPERS ============

function tryParseJson(input: unknown): any | null {
  if (typeof input !== "string") return null;
  const s = input.trim();
  if (!s) return null;

  // quick check (évite des try/catch inutiles)
  const looksJson = s.startsWith("{") || s.startsWith("[");
  if (!looksJson) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export async function getResourceHistory(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const { resourceHistory, users: usersTable } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: resourceHistory.id,
      action: resourceHistory.action,
      changes: resourceHistory.changes,
      createdAt: resourceHistory.createdAt,
      userId: resourceHistory.userId,
      userName: usersTable.name,
    })
    .from(resourceHistory)
    .leftJoin(usersTable, eq(resourceHistory.userId, usersTable.id))
    .where(eq(resourceHistory.resourceId, resourceId as number))
    .orderBy(desc(resourceHistory.createdAt));

  // ✅ Compat totale :
  // - on garde "changes" (string) tel quel
  // - on ajoute "changesJson" si c’est du JSON valide
  // - on stabilise userName si userId = null
  return (result as any[]).map((row) => {
    const parsed = tryParseJson(row?.changes);

    return {
      ...row,
      userName:
        row?.userId == null
          ? "Système"
          : (row?.userName ?? "Utilisateur"),
      changesJson: parsed, // null si ce n’est pas du JSON
    };
  });
}

export async function addResourceHistory(data: {
  resourceId: number;
  userId: number | null;
  action: string;
  changes?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { resourceHistory } = await import("../drizzle/schema");

  // ✅ On laisse MySQL gérer createdAt via DEFAULT CURRENT_TIMESTAMP
  const result = await db.insert(resourceHistory).values({
    resourceId: (data.resourceId || 0) as number,
    userId: (data.userId ?? null) as any,
    action: String(data.action || "").trim() || "updated",
    changes:
      data.changes !== undefined && data.changes !== null
        ? String(data.changes)
        : undefined,
  });

  return Number((result as any).insertId || 0);
}


export async function getAllResourceHistory(limit: number = 50) {
  const db = await getDb();
  if (!db) return [];

  const { resourceHistory, resources: resourcesTable, users: usersTable } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: resourceHistory.id,
      action: resourceHistory.action,
      changes: resourceHistory.changes,
      createdAt: resourceHistory.createdAt,
      resourceId: resourceHistory.resourceId,
      resourceTitle: resourcesTable.title,
      userId: resourceHistory.userId,
      userName: usersTable.name,
    })
    .from(resourceHistory)
    .innerJoin(resourcesTable, eq(resourceHistory.resourceId, resourcesTable.id))
    .leftJoin(usersTable, eq(resourceHistory.userId, usersTable.id))
    .orderBy(desc(resourceHistory.createdAt))
    .limit(limit);

  return result;
}

// Fonction pour lister les collections publiques
export async function getPublicCollections() {
  const db = await getDb();
  if (!db) return [];

  const { collections } = await import("../drizzle/schema");

  const result = await db
    .select()
    .from(collections)
    .where(
      and(
        eq(collections.accessLevel, "PUBLIC"),
        eq(collections.status, "approved")
      )
    )
    .orderBy(desc(collections.createdAt));

  return result;
}

export async function getCollectionsByResourceId(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const { collections, collectionResources } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: collections.id,
      userId: collections.userId,
      name: collections.name,
      description: collections.description,
      accessLevel: collections.accessLevel,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
    })
    .from(collectionResources)
    .innerJoin(collections, eq(collectionResources.collectionId, collections.id))
    .where(eq(collectionResources.resourceId, resourceId))
    .orderBy(desc(collections.createdAt));

  return result;
}

export async function getAnimationTechniqueResources(
  limit: number = 6,
  includeInternal: boolean = false,
  includePremium: boolean = false
) {
  const db = await getDb();
  if (!db) return [];

  const testTitles = ["Valid", "Titre mis à jour", "Test", "Résumé mis à jour"];

  const conditions: any[] = [
    // ✅ on exclut les titres de test
    sql`${resources.title} NOT IN (${testTitles.map((t) => `'${t}'`).join(",")})`,
    // ✅ on veut du contenu “vitrine”
    sql`${resources.summary} IS NOT NULL AND ${resources.summary} != ''`,
    // ✅ Gouvernance : jamais de non-publié côté catalogue
    eq(resources.status, "approved"),
  ];

  // ✅ SAFE-BY-DEFAULT (même règle que getAllResources / home)
  if (!includeInternal) {
    // Public: uniquement PUBLIC
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else if (includePremium) {
    // Connecté premium: PUBLIC + INTERNAL_IFAC + PREMIUM
    conditions.push(
      or(
        eq(resources.accessLevel, "PUBLIC"),
        eq(resources.accessLevel, "INTERNAL_IFAC"),
        eq(resources.accessLevel, "PREMIUM")
      )
    );
  } else {
    // Connecté non-premium: PUBLIC + INTERNAL_IFAC
    conditions.push(
      or(
        eq(resources.accessLevel, "PUBLIC"),
        eq(resources.accessLevel, "INTERNAL_IFAC")
      )
    );
  }

  const result = await db
    .select()
    .from(resources)
    .where(and(...conditions))
    .orderBy(desc(resources.createdAt))
    .limit(limit);

  return result;
}

// ============ RESOURCE CATEGORIES ============

export async function updateResourceCategories(
  resourceId: number,
  categoryKey: string | null
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update resource categories: database not available");
    return;
  }

  try {
    // ✅ Phase 1 (canonique) : category = string key ("a/b/c"), pas un JSON array
    const normalized = (categoryKey ?? "").toString().trim() || null;

    await db
      .update(resources)
      .set({ category: normalized as any })
      .where(eq(resources.id, resourceId));
  } catch (error) {
    console.error(`[Database] Error updating category for resource ${resourceId}:`, error);
    throw error;
  }
}


// ============ PROFILE HELPERS ============

export async function setUserProfile(
  userId: number,
  profileType: "animateur" | "formateur" | "directeur" | "stagiaire_bafa"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const profileTypeId = await resolveProfileTypeId(profileType);

  const existing = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set({ profileTypeId })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      profileTypeId,
    });
  }
}

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
  return result[0] || null;
}

// ============ FORMATEUR HELPERS ============

export async function createFormateur(email: string, password: string, firstName?: string, lastName?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.insert(formateurs).values({
    email,
    passwordHash,
    firstName,
    lastName,
  });

  return result;
}

export async function authenticateFormateur(email: string, password: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(formateurs).where(eq(formateurs.email, email));

  if (!result[0]) return null;

  const formateur = result[0];

  if (formateur.isActive === "false") return null;

  const isPasswordValid = await bcrypt.compare(password, formateur.passwordHash);
  if (!isPasswordValid) return null;

  await db.update(formateurs).set({ lastLogin: new Date().toISOString() }).where(eq(formateurs.id, formateur.id));

  return formateur;
}

export async function getFormateurByEmail(email: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(formateurs).where(eq(formateurs.email, email));
  return result[0] || null;
}

export async function updateFormateurPassword(formateurId: number, newPassword: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await db.update(formateurs).set({ passwordHash }).where(eq(formateurs.id, formateurId));
}

export async function getAllFormateurs() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(formateurs).orderBy(formateurs.createdAt);
}

export async function deactivateFormateur(formateurId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(formateurs).set({ isActive: "false" }).where(eq(formateurs.id, formateurId));
}

export async function activateFormateur(formateurId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(formateurs).set({ isActive: "true" }).where(eq(formateurs.id, formateurId));
}

// ============ RESOURCE PROFILE HELPERS ============

type ProfileKey = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

export async function associateResourceToProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  try {
    console.log(`[DB] Associating resource ${resourceId} to profile ${key} (id=${profileTypeId})`);
    await db.insert(resourceProfiles).values({
      resourceId,
      profileTypeId,
      addedAt: new Date().toISOString() as any,
    });
    console.log(`[DB] Successfully associated resource ${resourceId} to profile ${key}`);
  } catch (error: any) {
    console.log(`[DB] Error associating resource:`, error.code, error.message);
    if (error.code !== "ER_DUP_ENTRY" && error.sqlState !== "23000") {
      throw error;
    }
  }
}

export async function removeResourceFromProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  await db
    .delete(resourceProfiles)
    .where(
      and(
        eq(resourceProfiles.resourceId, resourceId),
        eq(resourceProfiles.profileTypeId, profileTypeId)
      )
    );
}

export async function getResourceProfiles(resourceId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(resourceProfiles).where(eq(resourceProfiles.resourceId, resourceId));
}

export async function getResourcesByProfile(profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  return await db
    .select()
    .from(resources)
    .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
    .where(eq(resourceProfiles.profileTypeId, profileTypeId));
}

export async function addResourceProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  try {
    await db.insert(resourceProfiles).values({
      resourceId,
      profileTypeId,
      addedAt: new Date().toISOString() as any,
    });
  } catch (error: any) {
    if (error.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }
}

export async function removeResourceProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  await db
    .delete(resourceProfiles)
    .where(
      and(
        eq(resourceProfiles.resourceId, resourceId),
        eq(resourceProfiles.profileTypeId, profileTypeId)
      )
    );
}

export async function setResourceProfiles(resourceId: number, profileTypesList: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(resourceProfiles).where(eq(resourceProfiles.resourceId, resourceId));

  const cleaned = (profileTypesList ?? []).filter(Boolean) as ProfileKey[];
  if (cleaned.length === 0) return;

  const idMap = await getProfileTypeIdMap();

  await db.insert(resourceProfiles).values(
    cleaned.map((key) => ({
      resourceId,
      profileTypeId: idMap.get(key)!,
      addedAt: new Date().toISOString() as any,
    }))
  );
}
// ============ COLLECTION PROFILE HELPERS ============



export async function associateCollectionToProfile(collectionId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  try {
    await db.insert(collectionProfiles).values({
      collectionId,
      profileTypeId,
      addedAt: new Date().toISOString() as any,
    });
  } catch (error: any) {
    if (error.code !== "ER_DUP_ENTRY") {
      throw error;
    }
  }
}

export async function removeCollectionFromProfile(collectionId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  await db
    .delete(collectionProfiles)
    .where(
      and(
        eq(collectionProfiles.collectionId, collectionId),
        eq(collectionProfiles.profileTypeId, profileTypeId)
      )
    );
}

export async function getCollectionProfiles(collectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(collectionProfiles)
    .where(eq(collectionProfiles.collectionId, collectionId));
}

export async function getCollectionsByProfile(profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = profileType as ProfileKey;
  const profileTypeId = await resolveProfileTypeId(key);

  return await db
    .select()
    .from(collections)
    .innerJoin(collectionProfiles, eq(collections.id, collectionProfiles.collectionId))
    .where(eq(collectionProfiles.profileTypeId, profileTypeId));
}
// ============ ACCESS LEVELS ============

export async function updateResourceAccessLevel(
  resourceId: number,
  accessLevel: "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // 🔒 Miroir legacy strict : visibility ne doit JAMAIS être incohérente avec accessLevel
  const visibility: "PUBLIC" | "INTERNAL_IFAC" =
    accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

  await db
    .update(resources)
    .set({ accessLevel, visibility })
    .where(eq(resources.id, resourceId));
}

export async function getAccessLevelStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const stats = await db
    .select({
      level: resources.accessLevel,
      count: sql`COUNT(*) as count`,
    })
    .from(resources)
    .groupBy(resources.accessLevel);

  return stats;
}

export async function getResourcesByAccessLevel(
  accessLevel: "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(resources).where(eq(resources.accessLevel, accessLevel));
}

/**
 * Détermine les profils accessibles selon le profil actuel et l'adhésion
 */
export function getAccessibleProfiles(userProfileType: string, hasSubscription: boolean): string[] {
  const allProfiles = ["animateur", "formateur", "directeur", "stagiaire_bafa"];

  if (userProfileType === "formateur") {
    if (hasSubscription) {
      return allProfiles;
    } else {
      return allProfiles;
    }
  } else {
    if (hasSubscription) {
      return allProfiles.filter((p) => p !== "formateur");
    } else {
      return [userProfileType];
    }
  }
}

/**
 * Filtre les ressources selon le profil et l'adhésion de l'utilisateur
 */
export async function getResourcesForUser(
  filters?: {
    search?: string;
    themeIds?: number[];
    collectionIds?: number[];
    type?: string;
    ageRange?: string;
    duration?: string;
    visibility?: "PUBLIC" | "INTERNAL_IFAC";
    includeInternal?: boolean;
    includePremium?: boolean;
    category?: string;
  },
  userProfileType?: string,
  hasSubscription?: boolean
) {
  const db = await getDb();
  if (!db) return [];

  const accessibleProfiles = userProfileType ? getAccessibleProfiles(userProfileType, hasSubscription || false) : undefined;

  const conditions: any[] = [];

  if (filters?.search) {
    conditions.push(
      or(
        like(resources.title, `%${filters.search}%`),
        like(resources.summary, `%${filters.search}%`),
        like(resources.content, `%${filters.search}%`)
      )
    );
  }

  if (filters?.type) {
    conditions.push(eq(resources.type, filters.type));
  }

  if (filters?.ageRange) {
    conditions.push(eq(resources.ageRange, filters.ageRange));
  }

  if (filters?.duration) {
    conditions.push(eq(resources.duration, filters.duration));
  }

  if (filters?.visibility) {
    conditions.push(eq(resources.visibility, filters.visibility));
  } else if (!filters?.includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
  }

  if (filters?.category) {
    conditions.push(eq(resources.category, filters.category));
  }

  // ===== Access level (SAFE-BY-DEFAULT) =====
  // - Non connecté : PUBLIC
  // - Connecté : PUBLIC + INTERNAL_IFAC
  // - Premium : PUBLIC + INTERNAL_IFAC + PREMIUM
  if (!filters?.includeInternal) {
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else if (filters?.includePremium) {
    conditions.push(
      or(
        eq(resources.accessLevel, "PUBLIC"),
        eq(resources.accessLevel, "INTERNAL_IFAC"),
        eq(resources.accessLevel, "PREMIUM")
      )
    );
  } else {
    conditions.push(
      or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "INTERNAL_IFAC"))
    );
  }

  // ===== Status (GOUVERNANCE) =====
  // Le catalogue ne doit JAMAIS exposer des drafts/pending/rejected
  conditions.push(eq(resources.status, "approved"));

  let query: any = db.select().from(resources);

  if (accessibleProfiles && accessibleProfiles.length > 0) {
        const profileTypeIdMap = await getProfileTypeIdMap();
    const accessibleProfileTypeIds = accessibleProfiles
      .map((k) => profileTypeIdMap.get(k))
      .filter((x): x is number => typeof x === "number");
    query = query
      .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
      .where(and(inArray(resourceProfiles.profileTypeId, accessibleProfileTypeIds as any), conditions.length > 0 ? and(...conditions) : undefined));
  } else if (filters?.collectionIds && filters.collectionIds.length > 0) {
    query = query
      .innerJoin(collectionResources, eq(resources.id, collectionResources.resourceId))
      .where(and(inArray(collectionResources.collectionId, filters.collectionIds), conditions.length > 0 ? and(...conditions) : undefined));
  } else if (filters?.themeIds && filters.themeIds.length > 0) {
    query = query
      .innerJoin(resourceThemes, eq(resources.id, resourceThemes.resourceId))
      .where(and(inArray(resourceThemes.themeId, filters.themeIds), conditions.length > 0 ? and(...conditions) : undefined));
  } else if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.orderBy(resources.createdAt);

  const resourcesMap = new Map<number, any>();
  result.forEach((row: any) => {
    const resource = row.resources || row;
    if (!resourcesMap.has(resource.id)) {
      resourcesMap.set(resource.id, resource);
    }
  });

  const resourcesWithCollections = await Promise.all(
    Array.from(resourcesMap.values()).map(async (resource: any) => {
      const collectionRows = await db
        .select()
        .from(collectionResources)
        .innerJoin(collections, eq(collectionResources.collectionId, collections.id))
        .where(eq(collectionResources.resourceId, resource.id));

      return {
        ...resource,
        collections: collectionRows.map((row: any) => row.collections),
      };
    })
  );

  return resourcesWithCollections;
}

export async function listCategoryKeys(filters?: {
  includeInternal?: boolean;
  includePremium?: boolean;
  profileType?: "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

  // ✅ vue admin = ne pas filtrer par accessLevel/status
  // 🔒 SÉCURITÉ (outil national) : pas de boolean, uniquement token interne
  adminView?: symbol;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  // 🔒 La vue admin n’est active QUE si on passe le token interne.
  const isAdminView = filters?.adminView === ADMIN_VIEW_TOKEN;

  // ===== Visibility (legacy) =====
  // Même règle que getAllResources : si pas includeInternal => PUBLIC uniquement
  if (!filters?.includeInternal && !isAdminView) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
  }

  // ===== Access level (SAFE-BY-DEFAULT) =====
  // - Public : PUBLIC
  // - Connecté non premium : PUBLIC + INTERNAL_IFAC
  // - Premium : PUBLIC + INTERNAL_IFAC + PREMIUM
  // - Admin view : pas de filtre
  if (!isAdminView) {
    if (!filters?.includeInternal) {
      conditions.push(eq(resources.accessLevel, "PUBLIC"));
    } else if (filters?.includePremium) {
      conditions.push(
        or(
          eq(resources.accessLevel, "PUBLIC"),
          eq(resources.accessLevel, "INTERNAL_IFAC"),
          eq(resources.accessLevel, "PREMIUM")
        )
      );
    } else {
      conditions.push(
        or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "INTERNAL_IFAC"))
      );
    }
  }

  // ===== Status (gouvernance) =====
  // Catalogue non-admin => seulement approved
  if (!isAdminView) {
    conditions.push(eq(resources.status, "approved"));
  }

  // base query
  let query: any = db.select({ category: resources.category }).from(resources);

  // si on filtre par profil, on join resourceProfiles
  if (filters?.profileType) {
    query = query
      .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
      .where(
        and(
          eq(resourceProfiles.profileTypeId, await resolveProfileTypeId(filters.profileType)),
          conditions.length > 0 ? and(...conditions) : undefined
        )
      );
  } else if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const rows = await query;

  // Convertit une category stockée (string "a/b" OU vieux JSON ["a","b"]) en key "a/b"
  const toCategoryKey = (raw: unknown): string | null => {
    const s = (raw ?? "").toString().trim();
    if (!s) return null;

    // Cas 1: déjà une clé "a/b"
    if (!s.startsWith("[") && !s.endsWith("]")) return s;

    // Cas 2: JSON ["a","b",...]
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        const parts = parsed
          .map((x) => (x ?? "").toString().trim())
          .filter(Boolean);
        if (parts.length === 0) return null;
        return parts.join("/");
      }
    } catch {
      // JSON invalide -> on ignore
    }

    return null;
  };

  const keys = (rows as any[])
    .map((r) => toCategoryKey(r?.category))
    .filter((x): x is string => !!x && x.length > 0);

  // distinct + tri
  return Array.from(new Set(keys)).sort((a, b) => a.localeCompare(b));
}

