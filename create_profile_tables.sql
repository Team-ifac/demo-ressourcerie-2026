-- Créer la table user_profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  userId INT NOT NULL PRIMARY KEY,
  profileType ENUM('animateur', 'formateur', 'directeur', 'stagiaire_bafa') NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Créer la table formateurs
CREATE TABLE IF NOT EXISTS formateurs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(320) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  isActive ENUM('true', 'false') DEFAULT 'true' NOT NULL,
  lastLogin TIMESTAMP,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- Créer la table resource_profiles
CREATE TABLE IF NOT EXISTS resource_profiles (
  resourceId INT NOT NULL,
  profileType ENUM('animateur', 'formateur', 'directeur', 'stagiaire_bafa') NOT NULL,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (resourceId, profileType),
  FOREIGN KEY (resourceId) REFERENCES resources(id) ON DELETE CASCADE
);

-- Créer la table collection_profiles
CREATE TABLE IF NOT EXISTS collection_profiles (
  collectionId INT NOT NULL,
  profileType ENUM('animateur', 'formateur', 'directeur', 'stagiaire_bafa') NOT NULL,
  addedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY (collectionId, profileType),
  FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE
);
