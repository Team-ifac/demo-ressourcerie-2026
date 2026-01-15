ALTER TABLE `cms_content` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cms_pages` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());--> statement-breakpoint
ALTER TABLE `cms_sections` MODIFY COLUMN `createdAt` timestamp NOT NULL DEFAULT (now());