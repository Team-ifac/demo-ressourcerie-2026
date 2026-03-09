ALTER TABLE `category_nodes`
  ADD COLUMN `profileTypeId` INT NULL AFTER `id`;

UPDATE `category_nodes` cn
JOIN `profile_types` pt ON pt.`key` = cn.`profileType`
SET cn.`profileTypeId` = pt.`id`;

ALTER TABLE `category_nodes`
  MODIFY COLUMN `profileTypeId` INT NOT NULL;

ALTER TABLE `category_nodes`
  ADD CONSTRAINT `fk_category_nodes_profile_type_id`
    FOREIGN KEY (`profileTypeId`) REFERENCES `profile_types`(`id`)
    ON DELETE RESTRICT;

ALTER TABLE `category_nodes`
  DROP INDEX `uniq_category_slug_per_parent_key`,
  ADD CONSTRAINT `uniq_category_slug_per_parent_key`
    UNIQUE (`profileTypeId`, `parentIdKey`, `slug`);

ALTER TABLE `category_nodes`
  DROP COLUMN `profileType`;