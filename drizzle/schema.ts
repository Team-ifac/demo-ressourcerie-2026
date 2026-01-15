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
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const analytics = mysqlTable("analytics", {
  id: int().primaryKey().autoincrement().notNull(),
  userId: int(),
  action: varchar({ length: 50 }).notNull(),
  resourceId: int(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

export const collectionProfiles = mysqlTable("collection_profiles", {
  collectionId: int()
    .notNull()
    .references(() => collections.id, { onDelete: "cascade" }),
  profileType: mysqlEnum(["animateur", "formateur", "directeur", "stagiaire_bafa"])
    .notNull(),
  addedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

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
  description: text(),
  isPublic: mysqlEnum(["true", "false"]).default("false").notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  imageUrl: text(),
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

export const resourceProfiles = mysqlTable("resource_profiles", {
  resourceId: int()
    .notNull()
    .references(() => resources.id, { onDelete: "cascade" }),
  profileType: mysqlEnum(["animateur", "formateur", "directeur", "stagiaire_bafa"])
    .notNull(),
  addedAt: timestamp({ mode: "string" }).defaultNow().notNull(),
});

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
  fileUrl: text(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
  category: text(),
  status: mysqlEnum(["draft", "pending", "approved", "rejected"])
    .default("approved")
    .notNull(),
  viewCount: int().default(0).notNull(),
  accessLevel: mysqlEnum(["PUBLIC", "AUTHENTICATED", "PREMIUM"])
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

export const userProfiles = mysqlTable("user_profiles", {
  userId: int()
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  profileType: mysqlEnum(["animateur", "formateur", "directeur", "stagiaire_bafa"])
    .notNull(),
  createdAt: timestamp({ mode: "string" }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: "string" }).defaultNow().onUpdateNow().notNull(),
});

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
