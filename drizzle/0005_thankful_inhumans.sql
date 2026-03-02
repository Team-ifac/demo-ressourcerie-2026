CREATE TABLE `profile_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`key` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `profile_types_id` PRIMARY KEY(`id`),
	CONSTRAINT `uniq_profile_types_key` UNIQUE(`key`)
);
--> statement-breakpoint
ALTER TABLE `collections` ADD `slug` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `status` enum('draft','pending','approved','rejected') DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `accessLevel` enum('PUBLIC','PREMIUM','INTERNAL_IFAC') DEFAULT 'PUBLIC' NOT NULL;--> statement-breakpoint
ALTER TABLE `collections` ADD `sortOrder` int DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `idx_profile_types_is_active` ON `profile_types` (`isActive`);--> statement-breakpoint
ALTER TABLE `collections` DROP COLUMN `isPublic`;