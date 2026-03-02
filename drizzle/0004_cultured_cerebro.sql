CREATE TABLE `entitlements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('PREMIUM','INTERNAL_ACCESS','EVENT_ACCESS') NOT NULL,
	`source` varchar(100) NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`startsAt` timestamp NOT NULL DEFAULT (now()),
	`endsAt` timestamp,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `entitlements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `resources` MODIFY COLUMN `status` enum('draft','pending','approved','rejected') NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE `resources` MODIFY COLUMN `accessLevel` enum('PUBLIC','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC';--> statement-breakpoint
ALTER TABLE `resources` ADD `thumbnailKey` varchar(512);--> statement-breakpoint
ALTER TABLE `resources` ADD `storageKey` varchar(512);--> statement-breakpoint
ALTER TABLE `entitlements` ADD CONSTRAINT `entitlements_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `idx_entitlements_user` ON `entitlements` (`userId`);--> statement-breakpoint
CREATE INDEX `idx_entitlements_type` ON `entitlements` (`type`);