CREATE TABLE `import_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`actionType` enum('AUDIT','DRY_RUN','WRITE') NOT NULL,
	`zipFileName` varchar(255),
	`extractRoot` text,
	`detectedPdfs` int NOT NULL DEFAULT 0,
	`inDb` int NOT NULL DEFAULT 0,
	`wouldImport` int NOT NULL DEFAULT 0,
	`wouldUpdate` int NOT NULL DEFAULT 0,
	`imported` int NOT NULL DEFAULT 0,
	`updated` int NOT NULL DEFAULT 0,
	`skipped` int NOT NULL DEFAULT 0,
	`failed` int NOT NULL DEFAULT 0,
	`logPath` text,
	`rawOutput` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `import_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `collection_profiles` ADD PRIMARY KEY(`collectionId`,`profileTypeId`);--> statement-breakpoint
ALTER TABLE `resource_profiles` ADD PRIMARY KEY(`resourceId`,`profileTypeId`);--> statement-breakpoint
ALTER TABLE `user_profiles` ADD PRIMARY KEY(`userId`,`profileTypeId`);--> statement-breakpoint
ALTER TABLE `collection_profiles` ADD `profileTypeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `resource_profiles` ADD `profileTypeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD `profileTypeId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `premiumOverride` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `import_history` ADD CONSTRAINT `import_history_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_import_history_user` ON `import_history` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_import_history_action_type` ON `import_history` (`actionType`);--> statement-breakpoint
CREATE INDEX `idx_import_history_created_at` ON `import_history` (`createdAt`);--> statement-breakpoint
ALTER TABLE `collection_profiles` ADD CONSTRAINT `collection_profiles_profileTypeId_profile_types_id_fk` FOREIGN KEY (`profileTypeId`) REFERENCES `profile_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `resource_profiles` ADD CONSTRAINT `resource_profiles_profileTypeId_profile_types_id_fk` FOREIGN KEY (`profileTypeId`) REFERENCES `profile_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_profiles` ADD CONSTRAINT `user_profiles_profileTypeId_profile_types_id_fk` FOREIGN KEY (`profileTypeId`) REFERENCES `profile_types`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_collection_profiles_profileTypeId` ON `collection_profiles` (`profileTypeId`);--> statement-breakpoint
CREATE INDEX `idx_resource_profiles_profileTypeId` ON `resource_profiles` (`profileTypeId`);--> statement-breakpoint
CREATE INDEX `idx_user_profiles_profileTypeId` ON `user_profiles` (`profileTypeId`);--> statement-breakpoint
ALTER TABLE `collection_profiles` DROP COLUMN `profileType`;--> statement-breakpoint
ALTER TABLE `resource_profiles` DROP COLUMN `profileType`;--> statement-breakpoint
ALTER TABLE `user_profiles` DROP COLUMN `profileType`;