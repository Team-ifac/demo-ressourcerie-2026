ALTER TABLE `category_nodes`
  MODIFY COLUMN `profileType`
    enum('animateur','formateur','directeur','stagiaire_bafa') NOT NULL,
  DROP INDEX `uniq_category_slug_per_parent_key`,
  ADD CONSTRAINT `uniq_category_slug_per_parent_key`
    UNIQUE (`profileType`,`parentIdKey`,`slug`);
