CREATE TABLE `analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`action` varchar(50) NOT NULL,
	`resourceId` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)

);
--> statement-breakpoint
CREATE TABLE `collection_profiles` (
	`collectionId` int NOT NULL,
	`profileType` enum('animateur','formateur','directeur','stagiaire_bafa') NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `collection_resources` (
	`collectionId` int NOT NULL,
	`resourceId` int NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `collections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`isPublic` enum('true','false') NOT NULL DEFAULT 'false',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`imageUrl` text
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `comments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`hasTested` enum('true','false') NOT NULL DEFAULT 'false',
	`rating` int,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`userId` int NOT NULL,
	`resourceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `formateurs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`isActive` enum('true','false') NOT NULL DEFAULT 'true',
	`lastLogin` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `learning_paths` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`icon` varchar(50) NOT NULL,
	`color` varchar(50) NOT NULL,
	`duration` varchar(100) NOT NULL,
	`level` varchar(50) NOT NULL,
	`steps` text NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`resourceId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(50) NOT NULL,
	`changes` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `resource_profiles` (
	`resourceId` int NOT NULL,
	`profileType` enum('animateur','formateur','directeur','stagiaire_bafa') NOT NULL,
	`addedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `resource_tags` (
	`resourceId` int NOT NULL,
	`tagId` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resource_themes` (
	`resourceId` int NOT NULL,
	`themeId` int NOT NULL
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`summary` text NOT NULL,
	`content` text NOT NULL,
	`type` varchar(100) NOT NULL,
	`ageRange` varchar(100),
	`duration` varchar(100),
	`level` varchar(100),
	`prepTime` varchar(100),
	`visibility` enum('PUBLIC','INTERNAL_IFAC') NOT NULL DEFAULT 'PUBLIC',
	`thumbnailUrl` text,
	`fileUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`category` text,
	`status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'approved',
	`viewCount` int NOT NULL DEFAULT 0,
	`accessLevel` enum('PUBLIC','AUTHENTICATED','PREMIUM') NOT NULL DEFAULT 'PUBLIC'
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`stripeCustomerId` varchar(255) NOT NULL,
	`stripeSubscriptionId` varchar(255) NOT NULL,
	`status` enum('active','canceled','past_due','unpaid','incomplete') NOT NULL,
	`currentPeriodStart` timestamp NOT NULL,
	`currentPeriodEnd` timestamp NOT NULL,
	`canceledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `tags` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`slug` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `user_profiles` (
	`userId` int NOT NULL,
	`profileType` enum('animateur','formateur','directeur','stagiaire_bafa') NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`firstName` varchar(255),
	`lastName` varchar(255),
	`passwordHash` varchar(255),
	`emailVerified` int NOT NULL DEFAULT 0,
	`emailVerificationToken` varchar(255),
	`passwordResetToken` varchar(255),
	`passwordResetExpiresAt` timestamp,
	`phone` varchar(20)
        ,PRIMARY KEY (`id`)
);
--> statement-breakpoint
ALTER TABLE `collection_profiles` ADD CONSTRAINT `collection_profiles_collectionId_collections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_resources` ADD CONSTRAINT `collection_resources_collectionId_collections_id_fk` FOREIGN KEY (`collectionId`) REFERENCES `collections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collection_resources` ADD CONSTRAINT `collection_resources_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `collections` ADD CONSTRAINT `collections_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `comments` ADD CONSTRAINT `comments_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `favorites` ADD CONSTRAINT `favorites_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_history` ADD CONSTRAINT `resource_history_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_profiles` ADD CONSTRAINT `resource_profiles_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_themes` ADD CONSTRAINT `resource_themes_resourceId_resources_id_fk` FOREIGN KEY (`resourceId`) REFERENCES `resources`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_themes` ADD CONSTRAINT `resource_themes_themeId_themes_id_fk` FOREIGN KEY (`themeId`) REFERENCES `themes`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `email` ON `formateurs` (`email`);--> statement-breakpoint
CREATE INDEX `stripeSubscriptionId` ON `subscriptions` (`stripeSubscriptionId`);--> statement-breakpoint
CREATE INDEX `tags_name_unique` ON `tags` (`name`);--> statement-breakpoint
CREATE INDEX `tags_slug_unique` ON `tags` (`slug`);--> statement-breakpoint
CREATE INDEX `themes_slug_unique` ON `themes` (`slug`);--> statement-breakpoint
CREATE INDEX `users_openId_unique` ON `users` (`openId`);
