ALTER TABLE `cms_content` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `cms_content` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `cms_pages` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `cms_pages` MODIFY COLUMN `updatedAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `cms_sections` MODIFY COLUMN `createdAt` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `cms_sections` MODIFY COLUMN `updatedAt` timestamp NOT NULL;