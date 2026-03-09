import {
  mysqlTable,
  mysqlSchema,
  AnyMySqlColumn,
  int,
  varchar,
  timestamp,
  foreignKey,
  mysqlEnum,
  text,
  index,
  uniqueIndex,
  primaryKey,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const analytics = mysqlTable("analytics", {
  id: int().primaryKey().autoincrement().notNull(),
  userId: int(),
  action: varchar({ length: 50 }).notNull(),
  resourceId: int(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const collectionProfiles = mysqlTable(
  "collection_profiles",
  {
    collectionId: int()
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),

    profileTypeId: int()
      .notNull()
      .references(() => profileTypes.id, { onDelete: "restrict" }),

    addedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.collectionId, table.profileTypeId] }),
    index("idx_collection_profiles_profileTypeId").on(table.profileTypeId),
  ]
);

export const collectionResources = mysqlTable("collection_resources", {
  collectionId: int()
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  addedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const collections = mysqlTable("collections", {
  id: int().primaryKey().autoincrement().notNull(),

  userId: int()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  name: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull(),

  description: text(),

  status: mysqlEnum(["draft", "pending", "approved", "rejected"])
    .default("draft")
    .notNull(),

  accessLevel: mysqlEnum(["PUBLIC", "PREMIUM", "INTERNAL_IFAC"])
    .default("PUBLIC")
    .notNull(),

  sortOrder: int().default(0).notNull(),

  imageUrl: text(),

  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
});

export const comments = mysqlTable("comments", {
  id: int().primaryKey().autoincrement().notNull(),
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  userId: int()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text().notNull(),
  hasTested: mysqlEnum(["true", "false"]).default("false").notNull(),
  rating: int(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
});

export const favorites = mysqlTable("favorites", {
  userId: int()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const formateurs = mysqlTable(
  "formateurs",
  {
    id: int().primaryKey().autoincrement().notNull(),
    email: varchar({ length: 320 }).notNull(),
    passwordHash: varchar({ length: 255 }).notNull(),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    isActive: mysqlEnum(["true", "false"]).default("true").notNull(),
    lastLogin: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("email").on(table.email)]
);

export const resourceHistory = mysqlTable("resource_history", {
  id: int().primaryKey().autoincrement().notNull(),
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  userId: int().notNull(),
  action: varchar({ length: 50 }).notNull(),
  changes: text(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const importHistory = mysqlTable(
  "import_history",
  {
    id: int().primaryKey().autoincrement().notNull(),

    userId: int()
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    actionType: mysqlEnum(["AUDIT", "DRY_RUN", "WRITE"]).notNull(),

    zipFileName: varchar({ length: 255 }),
    extractRoot: text(),

    detectedPdfs: int().default(0).notNull(),
    inDb: int().default(0).notNull(),
    wouldImport: int().default(0).notNull(),
    wouldUpdate: int().default(0).notNull(),

    imported: int().default(0).notNull(),
    updated: int().default(0).notNull(),
    skipped: int().default(0).notNull(),
    failed: int().default(0).notNull(),

    logPath: text(),
    rawOutput: text(),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_import_history_user").on(table.userId),
    index("idx_import_history_action_type").on(table.actionType),
    index("idx_import_history_created_at").on(table.createdAt),
  ]
);

export const resourceProfiles = mysqlTable(
  "resource_profiles",
  {
    resourceId: int()
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    profileTypeId: int()
      .notNull()
      .references(() => profileTypes.id, { onDelete: "restrict" }),

    addedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.resourceId, table.profileTypeId] }),
    index("idx_resource_profiles_profileTypeId").on(table.profileTypeId),
  ]
);

export const resourceTags = mysqlTable("resource_tags", {
  resourceId: int().notNull(),
  tagId: int().notNull(),
});

export const resourceThemes = mysqlTable("resource_themes", {
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  themeId: int()
    .notNull()
    .references(() => themes.id, { onDelete: "cascade" }),
});

export const resources = mysqlTable("resources", {
  id: int().primaryKey().autoincrement().notNull(),
  title: varchar({ length: 500 }).notNull(),
  summary: text().notNull(),
  content: text().notNull(),
  type: varchar({ length: 100 }).notNull(),
  ageRange: varchar({ length: 100 }),
  duration: varchar({ length: 100 }),
  level: varchar({ length: 100 }),
  prepTime: varchar({ length: 100 }),
  visibility: mysqlEnum(["PUBLIC", "INTERNAL_IFAC"]).default("PUBLIC").notNull(),

  thumbnailUrl: text(),
  thumbnailKey: varchar({ length: 512 }),

  fileUrl: text(),
  storageKey: varchar({ length: 512 }),

  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  category: text(),
  status: mysqlEnum(["draft", "pending", "approved", "rejected"])
  .default("draft")
  .notNull(),
  viewCount: int().default(0).notNull(),
  accessLevel: mysqlEnum(["PUBLIC", "INTERNAL_IFAC", "PREMIUM"])
    .default("PUBLIC")
    .notNull(),
});

export const subscriptions = mysqlTable(
  "subscriptions",
  {
    id: int().primaryKey().autoincrement().notNull(),
    userId: int()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stripeCustomerId: varchar({ length: 255 }).notNull(),
    stripeSubscriptionId: varchar({ length: 255 }).notNull(),
    status: mysqlEnum(["active", "canceled", "past_due", "unpaid", "incomplete"])
      .notNull(),
    currentPeriodStart: timestamp({ mode: "string" }).notNull(),
    currentPeriodEnd: timestamp({ mode: "string" }).notNull(),
    canceledAt: timestamp({ mode: "string" }),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => [index("stripeSubscriptionId").on(table.stripeSubscriptionId)]
);

// =====================================================
// Entitlements (droits contractuels d’accès)
// =====================================================

export const entitlements = mysqlTable(
  "entitlements",
  {
    id: int().primaryKey().autoincrement().notNull(),

    userId: int()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    type: mysqlEnum([
      "PREMIUM",
      "INTERNAL_ACCESS",
      "EVENT_ACCESS",
    ]).notNull(),

    source: varchar({ length: 100 }).notNull(),

    isActive: int().default(1).notNull(),

    startsAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    endsAt: timestamp({ mode: "string" }),

    metadata: text(),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    index("idx_entitlements_user").on(table.userId),
    index("idx_entitlements_type").on(table.type),
  ]
);

export const tags = mysqlTable(
  "tags",
  {
    id: int().primaryKey().autoincrement().notNull(),
    name: varchar({ length: 100 }).notNull(),
    slug: varchar({ length: 100 }).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("tags_name_unique").on(table.name),
    index("tags_slug_unique").on(table.slug),
  ]
);

export const themes = mysqlTable(
  "themes",
  {
    id: int().primaryKey().autoincrement().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [index("themes_slug_unique").on(table.slug)]
);

export const userProfiles = mysqlTable(
  "user_profiles",
  {
    userId: int()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    profileTypeId: int()
      .notNull()
      .references(() => profileTypes.id, { onDelete: "restrict" }),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.profileTypeId] }),
    index("idx_user_profiles_profileTypeId").on(table.profileTypeId),
  ]
);

export const learningPaths = mysqlTable("learning_paths", {
  id: int().primaryKey().autoincrement().notNull(),
  title: varchar({ length: 255 }).notNull(),
  description: text().notNull(),
  icon: varchar({ length: 50 }).notNull(),
  color: varchar({ length: 50 }).notNull(),
  duration: varchar({ length: 100 }).notNull(),
  level: varchar({ length: 50 }).notNull(),
  steps: text().notNull(), // JSON array of steps
  order: int().default(0).notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
});

export const users = mysqlTable(
  "users",
  {
    id: int().primaryKey().autoincrement().notNull(),
    openId: varchar({ length: 64 }).notNull(),
    name: text(),
    email: varchar({ length: 320 }),
    loginMethod: varchar({ length: 64 }),
    role: mysqlEnum(["user", "admin"]).default("user").notNull(),

    // ✅ Premium manuel (override) — 0/1 en DB
    premiumOverride: int().default(0).notNull(),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
    lastSignedIn: timestamp({ mode: "string" }).defaultNow().notNull(),
    firstName: varchar({ length: 255 }),
    lastName: varchar({ length: 255 }),
    passwordHash: varchar({ length: 255 }),
    emailVerified: int().default(0).notNull(),
    emailVerificationToken: varchar({ length: 255 }),
    passwordResetToken: varchar({ length: 255 }),
    passwordResetExpiresAt: timestamp({ mode: "string" }),
    phone: varchar({ length: 20 }),
  },
  (table) => [index("users_openId_unique").on(table.openId)]
);

// =====================================================
// Profile types (référence canonique) — extensible
// Objectif : ne plus coder en dur les profils partout.
// =====================================================

export const profileTypes = mysqlTable(
  "profile_types",
  {
    id: int().primaryKey().autoincrement().notNull(),

    // clé technique stable (ex: "animateur", "formateur", ...)
    key: varchar({ length: 64 }).notNull(),

    // libellé UI (ex: "Animateur", "Formateur", ...)
    label: varchar({ length: 255 }).notNull(),

    // permet de "désactiver" un profil sans supprimer l'historique
    isActive: int().default(1).notNull(),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
    updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_profile_types_key").on(table.key),
    index("idx_profile_types_is_active").on(table.isActive),
  ]
);

// =====================================================
// Editorial categories (taxonomie UI)
// =====================================================

export const categoryNodes = mysqlTable(
  "category_nodes",
  {
    id: int().primaryKey().autoincrement().notNull(),

    profileTypeId: int()
      .notNull()
      .references(() => profileTypes.id, { onDelete: "restrict" }),

    parentId: int(), // peut être NULL
    parentIdKey: varchar({ length: 255 }).notNull(),

    slug: varchar({ length: 255 }).notNull(),
    path: varchar({ length: 500 }).notNull(),
    title: varchar({ length: 255 }).notNull(),
    description: text(),

    sortOrder: int().default(0).notNull(),
    isActive: int().default(1).notNull(),

    createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_category_profile_type_id").on(table.profileTypeId),
    index("idx_category_parent").on(table.parentId),
    index("idx_category_parent_key").on(table.parentIdKey),
    uniqueIndex("uniq_category_slug_per_parent_key").on(
      table.profileTypeId,
      table.parentIdKey,
      table.slug
    ),
  ]
);

export const resourceCategoryNodes = mysqlTable(
  "resource_category_nodes",
  {
    resourceId: int()
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),

    categoryNodeId: int()
      .notNull()
      .references(() => categoryNodes.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.resourceId, table.categoryNodeId] }),
    index("idx_rcn_category").on(table.categoryNodeId),
  ]
);
