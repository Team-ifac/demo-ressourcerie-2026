-- 0006_create_profile_types (custom)
-- Objectif : créer la table profile_types (référence canonique) en base MySQL
-- Sans data loss. Idempotence volontairement non gérée ici : on veut échouer si ça existe déjà.

CREATE TABLE `profile_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `key` varchar(64) NOT NULL,
  `label` varchar(255) NOT NULL,
  `isActive` int NOT NULL DEFAULT 1,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_profile_types_key` (`key`),
  KEY `idx_profile_types_is_active` (`isActive`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed minimal : on initialise les 4 profils actuels (compatibles avec tes ENUM existants)
INSERT INTO `profile_types` (`key`, `label`, `isActive`)
VALUES
  ('animateur', 'Animateur', 1),
  ('formateur', 'Formateur', 1),
  ('directeur', 'Directeur', 1),
  ('stagiaire_bafa', 'Stagiaire BAFA', 1);