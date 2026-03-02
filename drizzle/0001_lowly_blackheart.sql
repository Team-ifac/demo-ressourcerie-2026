-- =========================================================
-- Migration neutralisée (tables déjà présentes en base)
-- On garde uniquement les ALTER idempotents.
-- =========================================================


-- category_nodes déjà créée en DB -> on ne recrée pas
-- CREATE TABLE `category_nodes` (
-- 	`id` int AUTO_INCREMENT NOT NULL,
-- 	`profileType` enum('animateur','formateur','directeur','stagiaire_bafa','public') NOT NULL,
-- 	`parentId` int,
-- 	`slug` varchar(255) NOT NULL,
-- 	`title` varchar(255) NOT NULL,
-- 	`description` text,
-- 	`sortOrder` int NOT NULL DEFAULT 0,
-- 	`isActive` int NOT NULL DEFAULT 1,
-- 	`createdAt` timestamp NOT NULL DEFAULT (now()),
-- 	CONSTRAINT `category_nodes_id` PRIMARY KEY(`id`),
-- 	CONSTRAINT `uniq_category_slug_per_parent` UNIQUE(`profileType`,`parentId`,`slug`)
-- );
-- --> statement-breakpoint


-- resource_category_nodes déjà créée en DB -> on ne recrée pas
-- CREATE TABLE `resource_category_nodes` (
-- 	`resourceId` int NOT NULL,
-- 	`categoryNodeId` int NOT NULL,
-- 	CONSTRAINT `resource_category_nodes_resourceId_categoryNodeId_pk`
-- 		PRIMARY KEY(`resourceId`,`categoryNodeId`)
-- );
-- --> statement-breakpoint


-- =========================================================
-- ALTER idempotents : OK même si déjà en place
-- =========================================================

ALTER TABLE `analytics` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `collection_profiles` MODIFY COLUMN `addedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `collection_resources` MODIFY COLUMN `addedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `collections` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `comments` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `favorites` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `formateurs` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `learning_paths` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `resource_history` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `resource_profiles` MODIFY COLUMN `addedAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `resources` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `subscriptions` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `tags` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `themes` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `user_profiles` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `lastSignedIn` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint


-- =========================================================
-- Ces lignes provoquent des erreurs car les PK existent déjà
-- =========================================================
-- ALTER TABLE `analytics` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `collections` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `comments` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `formateurs` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `learning_paths` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `resource_history` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `resources` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `subscriptions` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `tags` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `themes` ADD PRIMARY KEY(`id`);--> statement-breakpoint
-- ALTER TABLE `users` ADD PRIMARY KEY(`id`);--> statement-breakpoint


-- =========================================================
-- Index : on ne les rejoue pas (risque "already exists")
-- =========================================================
-- CREATE INDEX `idx_category_profile` ON `category_nodes` (`profileType`);--> statement-breakpoint
-- CREATE INDEX `idx_category_parent` ON `category_nodes` (`parentId`);--> statement-breakpoint
-- CREATE INDEX `idx_rcn_category` ON `resource_category_nodes` (`categoryNodeId`);
