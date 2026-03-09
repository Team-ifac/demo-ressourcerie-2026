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
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `import_history_id` PRIMARY KEY (`id`),
  CONSTRAINT `import_history_userId_users_id_fk`
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
);

CREATE INDEX `idx_import_history_user`
ON `import_history` (`userId`);

CREATE INDEX `idx_import_history_action_type`
ON `import_history` (`actionType`);

CREATE INDEX `idx_import_history_created_at`
ON `import_history` (`createdAt`);