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
} from "../drizzle/schema";
import { ENV } from "./_core/env";
import bcrypt from "bcryptjs";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
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

export async function getAllResources(filters?: {
  search?: string;
  themeIds?: number[];
  collectionIds?: number[];
  type?: string;
  ageRange?: string;
  duration?: string;
  visibility?: "PUBLIC" | "INTERNAL_IFAC";
  includeInternal?: boolean;
  category?: string;
  profileType?: "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

  // ✅ vue admin = ne pas filtrer par accessLevel
  adminView?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];

  console.log("[DEBUG] getAllResources filters:", JSON.stringify(filters, null, 2));

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

  // ===== Visibility =====
  if (filters?.visibility) {
    conditions.push(eq(resources.visibility, filters.visibility));
  } else if (!filters?.includeInternal) {
    // public: uniquement PUBLIC
    conditions.push(eq(resources.visibility, "PUBLIC"));
  }
  // si includeInternal = true et pas de visibility explicite => on laisse passer PUBLIC + INTERNAL_IFAC

  if (filters?.category) {
    console.log("[DEBUG] Adding category filter:", filters.category);
    conditions.push(eq(resources.category, filters.category));
  }

  // ===== Access level =====
  // - Public (non connecté) : PUBLIC uniquement
  // - Connecté (includeInternal) : PUBLIC + AUTHENTICATED
  // - Admin (adminView) : pas de filtre (PUBLIC/AUTHENTICATED/PREMIUM)
  if (!filters?.adminView) {
    if (filters?.includeInternal) {
      conditions.push(or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "AUTHENTICATED")));
    } else {
      conditions.push(eq(resources.accessLevel, "PUBLIC"));
    }
  }

  if (filters?.profileType) {
    console.log("[DEBUG] Adding profile filter:", filters.profileType);
    conditions.push(eq(resourceProfiles.profileType, filters.profileType));
  }

  console.log("[DEBUG] Total conditions:", conditions.length);

  let query: any = db.select().from(resources);

  if (filters?.profileType) {
    query = query
      .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
      .where(
        and(
          eq(resourceProfiles.profileType, filters.profileType),
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

  const result = await query.orderBy(resources.createdAt);

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

  if (!includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else {
    conditions.push(or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "AUTHENTICATED")));
  }

  let query: any = db.select().from(resources);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const result = await query.orderBy(desc(resources.createdAt)).limit(limit);

  return result;
}

export async function getPopularResources(limit: number, includeInternal: boolean) {
  const db = await getDb();
  if (!db) return [];

  const conditions: any[] = [];

  if (!includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else {
    conditions.push(or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "AUTHENTICATED")));
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
  isAdmin: boolean; // ctx.user.role === 'admin' ?
  autoLimit?: number; // défaut 6
  editorialLimit?: number; // défaut 2
}) {
  const db = await getDb();
  if (!db) return [];

  const autoLimit = params.autoLimit ?? 6;
  const editorialLimit = params.editorialLimit ?? 2;

  const baseConditions: any[] = [];

  // Accès visibilité / accessLevel (on garde ta logique)
  if (!params.includeInternal) {
    baseConditions.push(eq(resources.visibility, "PUBLIC"));
    baseConditions.push(eq(resources.accessLevel, "PUBLIC"));
  } else {
    baseConditions.push(or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "AUTHENTICATED")));
  }

  // On évite d’exposer des drafts aux non-admin sur la home
  if (!params.isAdmin) {
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
    .orderBy(desc(resources.viewCount), desc(resources.createdAt))
    .limit(autoLimit + editorialLimit + 10);

  const autoResources = autoRows.filter((r: any) => !editorialIds.has(Number(r.id))).slice(0, autoLimit);

  // 3) Résultat final (max 8)
  return [...editorialResources, ...autoResources].slice(0, editorialLimit + autoLimit);
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
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

  const [result] = await db.insert(resources).values(resource);
  const resourceId = Number((result as any).insertId);

  if (themeIds.length > 0) {
    await db.insert(resourceThemes).values(themeIds.map((themeId) => ({ resourceId, themeId })));
  }

  return resourceId;
}

export async function updateResource(id: number, resource: Partial<any>, themeIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(resources).set(resource).where(eq(resources.id, id));

  if (themeIds !== undefined) {
    await db.delete(resourceThemes).where(eq(resourceThemes.resourceId, id));
    if (themeIds.length > 0) {
      await db.insert(resourceThemes).values(themeIds.map((themeId) => ({ resourceId: id, themeId })));
    }
  }
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(resources).where(eq(resources.id, id));
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

export async function createCollection(data: { userId: number; name: string; description?: string; isPublic: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { collections } = await import("../drizzle/schema");

  const [result] = await db.insert(collections).values({
    userId: data.userId,
    name: data.name,
    description: data.description || undefined,
    isPublic: (data.isPublic ? "true" : "false") as any,
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

export async function getCollectionResources(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  const { resources: resourcesTable, collectionResources } = await import("../drizzle/schema");

  const result = await db
    .select({
      id: resourcesTable.id,
      title: resourcesTable.title,
      summary: resourcesTable.summary,
      type: resourcesTable.type,
      ageRange: resourcesTable.ageRange,
      duration: resourcesTable.duration,
      visibility: resourcesTable.visibility,
      thumbnailUrl: resourcesTable.thumbnailUrl,
      createdAt: resourcesTable.createdAt,
      addedAt: collectionResources.addedAt,
    })
    .from(collectionResources)
    .innerJoin(resourcesTable, eq(collectionResources.resourceId, resourcesTable.id))
    .where(eq(collectionResources.collectionId, collectionId))
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

export async function updateComment(id: number, data: { content?: string; rating?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { comments } = await import("../drizzle/schema");

  await db
    .update(comments)
    .set({
      ...data,
      updatedAt: new Date().toISOString() as any,
    })
    .where(eq(comments.id, id));
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

  return result;
}

export async function addResourceHistory(data: { resourceId: number; userId: number | null; action: string; changes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const { resourceHistory } = await import("../drizzle/schema");

  // ✅ FIX DÉFINITIF
  // On laisse MySQL gérer createdAt via DEFAULT CURRENT_TIMESTAMP
  const result = await db.insert(resourceHistory).values({
    resourceId: (data.resourceId || 0) as number,
    userId: (data.userId ?? null) as any,
    action: data.action,
    changes: data.changes || undefined,
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
    .where(eq(collections.isPublic, "true"))
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
      isPublic: collections.isPublic,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
    })
    .from(collectionResources)
    .innerJoin(collections, eq(collectionResources.collectionId, collections.id))
    .where(eq(collectionResources.resourceId, resourceId))
    .orderBy(desc(collections.createdAt));

  return result;
}

export async function getAnimationTechniqueResources(limit: number = 6, includeInternal: boolean = false) {
  const db = await getDb();
  if (!db) return [];

  const testTitles = ["Valid", "Titre mis à jour", "Test", "Résumé mis à jour"];

  let query: any = db.select().from(resources);

  const conditions: any[] = [
    sql`${resources.title} NOT IN (${testTitles.map((t) => `'${t}'`).join(",")})`,
    sql`${resources.summary} IS NOT NULL AND ${resources.summary} != ''`,
  ];

  if (!includeInternal) {
    conditions.push(eq(resources.visibility, "PUBLIC"));
  }

  const result = await query.where(and(...conditions)).orderBy(desc(resources.createdAt)).limit(limit);

  return result;
}

// ============ RESOURCE CATEGORIES ============

export async function updateResourceCategories(resourceId: number, categories: string[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update resource categories: database not available");
    return;
  }

  try {
    await db.update(resources).set({ category: JSON.stringify(categories) }).where(eq(resources.id, resourceId));
  } catch (error) {
    console.error(`[Database] Error updating categories for resource ${resourceId}:`, error);
    throw error;
  }
}

// ============ PROFILE HELPERS ============

export async function setUserProfile(userId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db
      .update(userProfiles)
      .set({ profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa" })
      .where(eq(userProfiles.userId, userId));
  } else {
    await db.insert(userProfiles).values({
      userId,
      profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
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

export async function associateResourceToProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    console.log(`[DB] Associating resource ${resourceId} to profile ${profileType}`);
    await db.insert(resourceProfiles).values({
      resourceId,
      profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
    });
    console.log(`[DB] Successfully associated resource ${resourceId} to profile ${profileType}`);
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

  await db
    .delete(resourceProfiles)
    .where(
      and(
        eq(resourceProfiles.resourceId, resourceId),
        eq(resourceProfiles.profileType, profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa")
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

  return await db
    .select()
    .from(resources)
    .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
    .where(eq(resourceProfiles.profileType, profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa"));
}

export async function addResourceProfile(resourceId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(resourceProfiles).values({
      resourceId,
      profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
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

  await db
    .delete(resourceProfiles)
    .where(
      and(
        eq(resourceProfiles.resourceId, resourceId),
        eq(resourceProfiles.profileType, profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa")
      )
    );
}

export async function setResourceProfiles(resourceId: number, profileTypes: string[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(resourceProfiles).where(eq(resourceProfiles.resourceId, resourceId));

  if (profileTypes.length > 0) {
    await db.insert(resourceProfiles).values(
      profileTypes.map((profileType) => ({
        resourceId,
        profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
      }))
    );
  }
}

// ============ COLLECTION PROFILE HELPERS ============

export async function associateCollectionToProfile(collectionId: number, profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.insert(collectionProfiles).values({
      collectionId,
      profileType: profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
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

  await db
    .delete(collectionProfiles)
    .where(
      and(
        eq(collectionProfiles.collectionId, collectionId),
        eq(collectionProfiles.profileType, profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa")
      )
    );
}

export async function getCollectionProfiles(collectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.select().from(collectionProfiles).where(eq(collectionProfiles.collectionId, collectionId));
}

export async function getCollectionsByProfile(profileType: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .select()
    .from(collections)
    .innerJoin(collectionProfiles, eq(collections.id, collectionProfiles.collectionId))
    .where(eq(collectionProfiles.profileType, profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa"));
}

// ============ ACCESS LEVELS ============

export async function updateResourceAccessLevel(resourceId: number, accessLevel: "PUBLIC" | "AUTHENTICATED" | "PREMIUM"): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(resources).set({ accessLevel }).where(eq(resources.id, resourceId));
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

export async function getResourcesByAccessLevel(accessLevel: "PUBLIC" | "AUTHENTICATED" | "PREMIUM") {
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

  if (filters?.includeInternal) {
    conditions.push(or(eq(resources.accessLevel, "PUBLIC"), eq(resources.accessLevel, "AUTHENTICATED")));
  } else {
    conditions.push(eq(resources.accessLevel, "PUBLIC"));
  }

  let query: any = db.select().from(resources);

  if (accessibleProfiles && accessibleProfiles.length > 0) {
    query = query
      .innerJoin(resourceProfiles, eq(resources.id, resourceProfiles.resourceId))
      .where(and(inArray(resourceProfiles.profileType, accessibleProfiles as any), conditions.length > 0 ? and(...conditions) : undefined));
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
