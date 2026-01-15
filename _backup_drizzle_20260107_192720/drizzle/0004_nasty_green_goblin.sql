ALTER TABLE `users` ADD `firstName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `lastName` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordHash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` tinyint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerificationToken` varchar(255);