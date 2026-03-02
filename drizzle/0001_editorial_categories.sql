-- =====================================================
-- Catégories éditoriales (taxonomie UI)
-- =====================================================

CREATE TABLE category_nodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profileType ENUM('animateur','formateur','directeur','stagiaire_bafa','public') NOT NULL,
  parentId INT NULL,
  slug VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_category_parent
    FOREIGN KEY (parentId) REFERENCES category_nodes(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_category_profile ON category_nodes(profileType);
CREATE INDEX idx_category_parent ON category_nodes(parentId);
CREATE UNIQUE INDEX uniq_category_slug_per_parent
  ON category_nodes(profileType, parentId, slug);

-- =====================================================
-- Mapping ressources → catégories éditoriales
-- =====================================================

CREATE TABLE resource_category_nodes (
  resourceId INT NOT NULL,
  categoryNodeId INT NOT NULL,
  PRIMARY KEY (resourceId, categoryNodeId),

  CONSTRAINT fk_rcn_resource
    FOREIGN KEY (resourceId) REFERENCES resources(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_rcn_category
    FOREIGN KEY (categoryNodeId) REFERENCES category_nodes(id)
    ON DELETE CASCADE
);

CREATE INDEX idx_rcn_category ON resource_category_nodes(categoryNodeId);
