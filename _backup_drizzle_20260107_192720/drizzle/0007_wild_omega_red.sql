CREATE TABLE `cms_content` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sectionId` int NOT NULL,
	`key` varchar(255) NOT NULL,
	`value` text NOT NULL,
	`contentType` varchar(50) NOT NULL DEFAULT 'text',
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, 
        `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cms_content_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cms_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
        `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT `cms_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `cms_pages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `cms_sections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`pageId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`type` varchar(50) NOT NULL,
	`order` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        CONSTRAINT `cms_sections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `cms_content` ADD CONSTRAINT `cms_content_sectionId_cms_sections_id_fk` FOREIGN KEY (`sectionId`) REFERENCES `cms_sections`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `cms_sections` ADD CONSTRAINT `cms_sections_pageId_cms_pages_id_fk` FOREIGN KEY (`pageId`) REFERENCES `cms_pages`(`id`) ON DELETE cascade ON UPDATE no action;
