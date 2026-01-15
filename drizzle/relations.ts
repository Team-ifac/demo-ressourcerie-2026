import { relations } from "drizzle-orm/relations";
import { collections, collectionProfiles, collectionResources, resources, users, comments, favorites, resourceHistory, resourceProfiles, resourceThemes, themes, subscriptions, userProfiles } from "./schema";

export const collectionProfilesRelations = relations(collectionProfiles, ({one}) => ({
	collection: one(collections, {
		fields: [collectionProfiles.collectionId],
		references: [collections.id]
	}),
}));

export const collectionsRelations = relations(collections, ({one, many}) => ({
	collectionProfiles: many(collectionProfiles),
	collectionResources: many(collectionResources),
	user: one(users, {
		fields: [collections.userId],
		references: [users.id]
	}),
}));

export const collectionResourcesRelations = relations(collectionResources, ({one}) => ({
	collection: one(collections, {
		fields: [collectionResources.collectionId],
		references: [collections.id]
	}),
	resource: one(resources, {
		fields: [collectionResources.resourceId],
		references: [resources.id]
	}),
}));

export const resourcesRelations = relations(resources, ({many}) => ({
	collectionResources: many(collectionResources),
	comments: many(comments),
	favorites: many(favorites),
	resourceHistories: many(resourceHistory),
	resourceProfiles: many(resourceProfiles),
	resourceThemes: many(resourceThemes),
}));

export const usersRelations = relations(users, ({many}) => ({
	collections: many(collections),
	comments: many(comments),
	favorites: many(favorites),
	subscriptions_userId: many(subscriptions, {
		relationName: "subscriptions_userId_users_id"
	}),
	subscriptions_userId: many(subscriptions, {
		relationName: "subscriptions_userId_users_id"
	}),
	userProfiles: many(userProfiles),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	resource: one(resources, {
		fields: [comments.resourceId],
		references: [resources.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
	resource: one(resources, {
		fields: [favorites.resourceId],
		references: [resources.id]
	}),
}));

export const resourceHistoryRelations = relations(resourceHistory, ({one}) => ({
	resource: one(resources, {
		fields: [resourceHistory.resourceId],
		references: [resources.id]
	}),
}));

export const resourceProfilesRelations = relations(resourceProfiles, ({one}) => ({
	resource: one(resources, {
		fields: [resourceProfiles.resourceId],
		references: [resources.id]
	}),
}));

export const resourceThemesRelations = relations(resourceThemes, ({one}) => ({
	resource: one(resources, {
		fields: [resourceThemes.resourceId],
		references: [resources.id]
	}),
	theme: one(themes, {
		fields: [resourceThemes.themeId],
		references: [themes.id]
	}),
}));

export const themesRelations = relations(themes, ({many}) => ({
	resourceThemes: many(resourceThemes),
}));

export const subscriptionsRelations = relations(subscriptions, ({one}) => ({
	user_userId: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
		relationName: "subscriptions_userId_users_id"
	}),
	user_userId: one(users, {
		fields: [subscriptions.userId],
		references: [users.id],
		relationName: "subscriptions_userId_users_id"
	}),
}));

export const userProfilesRelations = relations(userProfiles, ({one}) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id]
	}),
}));