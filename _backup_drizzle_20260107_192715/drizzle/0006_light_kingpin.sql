ALTER TABLE `users` ADD `passwordResetToken` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `passwordResetExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);