# Ressourcerie IFAC - TODO

## Étapes complétées (Phases 1-3)
- [x] Test du flux d'adhésion complet
- [x] Configuration des webhooks Stripe en production
- [x] Notifications par email

## Phase 4 - Configurer Stripe en production
- [x] Créer un guide de configuration Stripe (STRIPE_SETUP.md)
- [x] Documenter la création d'un compte Stripe en production
- [x] Documenter l'obtention des clés API Stripe
- [x] Documenter la création d'un produit et d'un prix
- [x] Documenter la configuration des webhooks
- [ ] Créer un compte Stripe en production
- [ ] Obtenir les clés API Stripe (STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY)
- [ ] Créer un produit et un prix dans Stripe
- [ ] Configurer STRIPE_PRICE_ID dans les variables d'environnement
- [ ] Configurer les webhooks Stripe en production
- [ ] Tester le flux de paiement complet
- [ ] Valider les transitions de statut d'adhésion

## Phase 5 - Intégrer un service d'email
- [x] Choisir un service d'email (SendGrid)
- [x] Créer le service d'email SendGrid (server/emailService.ts)
- [x] Implémenter l'envoi d'emails de confirmation
- [x] Implémenter l'envoi d'emails de renouvellement
- [x] Implémenter l'envoi d'emails d'échec de paiement
- [x] Implémenter l'envoi d'emails d'annulation
- [x] Créer les tests unitaires (13 tests passés)
- [x] Créer un guide de configuration (EMAIL_SETUP.md)
- [ ] Configurer les clés API du service d'email
- [ ] Tester les emails en production

## Phase 6 - Ajouter des fonctionnalités supplémentaires
- [x] Dashboard d'adhésion pour les utilisateurs
  - [x] Afficher le statut de l'adhésion
  - [x] Afficher la liste des avantages
  - [x] Bouton pour s'abonner
  - [x] Intégrer la route /gestion-adhesion
- [x] Procédures tRPC supplémentaires
  - [x] getInvoices - Récupère l'historique des factures
  - [x] cancelSubscription - Annule une adhésion
- [ ] Gestion des renouvellements automatiques
- [ ] Historique des paiements complet
- [ ] Page de gestion des abonnements avancée

## Phase 7 - Déployer en production
- [x] Créer un checkpoint final avec toutes les modifications
- [ ] Publier le projet via le bouton Publish
- [ ] Configurer le domaine personnalisé (optionnel)
- [ ] Mettre en place le monitoring
- [ ] Tester le flux complet en production
- [ ] Documenter les procédures de maintenance

## Phase 8 - Améliorer le flux de connexion/inscription (✅ COMPLÉTÉ)

## Phase 9 - Ajouter les fonctionnalités manquantes et clarifier les accès

### Fonctionnalités à ajouter
- [ ] Mot de passe oublié (page /auth/forgot-password)
- [ ] Réinitialisation du mot de passe par email
- [ ] Page de modification du profil (/profile ou /settings)
- [ ] Modifier : prénom, nom, email, téléphone
- [ ] Changer le mot de passe

### Gestion des ressources
- [ ] Affecter une ressource à PLUSIEURS profils
- [ ] Contrôle d'accès par profil (70% vs 100%)
- [ ] Ressources Formateur privées (réservées)

### Import des formateurs
- [ ] Page d'import Excel (/admin/import-formateurs)
- [ ] Création automatique des comptes Formateur
- [ ] Envoi d'email de configuration (manuel par l'admin)
- [ ] Parser le fichier Excel (Nom, Prénom, Email)

### Logique d'adhésion et accès
- [ ] Formateur : 100% (sauf ressources Formateur privées) + avec adhésion = 100% + ressources privées
- [ ] Autres profils : 70% sans adhésion, 100% avec adhésion (sauf Formateur privées)

### Refactorisation de la page d'accueil
- [ ] Supprimer la redondance profil/qui êtes-vous
- [ ] Afficher les 4 profils directement
- [ ] Nettoyer la navigation (onglets confus)
- [ ] Simplifier le flux : Accueil → Sélection profil → Ressources

## Phase 8 - Améliorer le flux de connexion/inscription

### Modifications apportées
- [x] Ajouter une page intermédiaire Connexion vs Inscription (AuthChoice.tsx)
- [x] Créer un formulaire d'inscription personnalisé (AuthSignup.tsx)
  - [x] Champs : Nom, Prénom, Email, Profil, Mot de passe
  - [x] Validation complète des données
  - [x] Création du compte en base de données
  - [x] Envoi d'email de vérification
- [x] Créer une page de login (AuthLogin.tsx)
  - [x] Formulaire email/mot de passe
  - [x] Validation des identifiants
- [x] Créer une page de vérification d'email (AuthVerifyEmail.tsx)
  - [x] Vérification du token
  - [x] Activation du compte
- [x] Ajouter les routes dans App.tsx
  - [x] /auth/choice
  - [x] /auth/signup
  - [x] /auth/login
  - [x] /auth/verify-email
- [x] Modifier le schéma de base de données
  - [x] Ajouter firstName, lastName
  - [x] Ajouter passwordHash, loginMethod
  - [x] Ajouter emailVerified, emailVerificationToken
- [x] Créer les procédures tRPC
  - [x] signup - Créer un nouveau compte
  - [x] login - Authentifier avec email/mot de passe
  - [x] verifyEmail - Vérifier l'email
- [x] Créer les fonctions d'authentification (auth.ts)
  - [x] createUserWithEmail
  - [x] verifyUserEmail
  - [x] authenticateWithEmail
  - [x] hashPassword, verifyPassword
- [x] Ajouter la fonction d'email de vérification
  - [x] sendVerificationEmail
- [x] Créer les tests unitaires
  - [x] 5 tests d'authentification passés

## Résumé des fichiers créés/modifiés

### Fichiers créés
- server/auth.ts - Fonctions d'authentification
- server/auth.signup.test.ts - Tests unitaires (5 tests)
- server/emailService.ts - Service d'email SendGrid
- server/emailService.test.ts - Tests unitaires (13 tests)
- client/src/pages/AuthChoice.tsx - Page de choix Connexion/Inscription
- client/src/pages/AuthSignup.tsx - Formulaire d'inscription
- client/src/pages/AuthLogin.tsx - Formulaire de connexion
- client/src/pages/AuthVerifyEmail.tsx - Page de vérification d'email
- client/src/pages/SubscriptionDashboard.tsx - Dashboard d'adhésion
- STRIPE_SETUP.md - Guide de configuration Stripe
- EMAIL_SETUP.md - Guide de configuration des emails

### Fichiers modifiés
- drizzle/schema.ts - Ajout des champs d'authentification
- server/routers.ts - Ajout des procédures tRPC d'authentification
- client/src/App.tsx - Ajout des routes d'authentification

### Dépendances ajoutées
- argon2 - Hachage sécurisé des mots de passe
- @sendgrid/mail - Service d'email SendGrid

## Phase 5 - Import Excel des formateurs
- [x] Créer procédure tRPC `admin.importFormateurs` pour parser Excel
- [x] Générer token d'activation pour chaque formateur
- [x] Envoyer email avec lien d'activation
- [x] Créer page `/auth/set-password` pour définir le mot de passe
- [x] Créer page admin `/admin/import-formateurs` pour uploader le fichier
- [x] Tester l'import avec le fichier fourni

## Phase 6 - Refactoriser la page d'accueil
- [x] Vérifier que la page actuelle correspond à la capture d'écran
- [x] Garder : Hero + Stats + Profils + Ressources récentes + Techniques d'animation + Newsletter + Footer
- [x] Supprimer les sections redondantes
- [x] Tester la responsivité

## Phase 7 - Tests et checkpoint final

- [ ] Tester les 4 profils de test (accès 70% vs 100%)
- [ ] Tester l'import Excel des formateurs
- [ ] Tester le lien d'activation par email
- [ ] Créer checkpoint final


## Phase 10 - CMS Simplifié pour l'Administration ✅ COMPLET

### Objectif
Créer une interface CMS qui permet aux administrateurs de modifier le contenu des pages (texte, images, sections) **sans toucher au code**.

### Tâches
- [x] Créer le backend CMS avec tRPC
  - [x] Service CMS pour gérer les pages et sections
  - [x] Stockage sur S3 en JSON
  - [x] Procédures tRPC : getPage, savePage, updateSection, deleteSection
- [x] Créer l'interface admin CMS
  - [x] Page `/admin/cms` pour gérer les pages
  - [x] Sélection des pages (Accueil, À propos, Aide, Parcours)
  - [x] Édition des sections (texte, images, boutons, liens)
  - [x] Modification du titre et description de la page
  - [x] Bouton "Modifier" pour éditer les métadonnées
  - [x] Texte original visible et sélectionné automatiquement
  - [x] Sauvegarde correcte et persistante des modifications
- [x] Tester le CMS
  - [x] Modifier le contenu d'une page (titre changé avec succès)
  - [x] Vérifier que les changements sont sauvegardés (persistance confirmée)
  - [x] Interface complète et fonctionnelle
- [x] Créer un checkpoint


## Phase 11 - Editeurs Visuels pour les Sections CMS COMPLET

### Objectif
Creer des editeurs visuels pour chaque type de section (Hero, Parcours, Texte, etc.) pour permettre la modification facile du contenu sans JSON.

### Taches
- [x] Creer un editeur visuel pour sections Hero
  - [x] Champs : Titre, Sous-titre, Image, Bouton CTA
- [x] Creer un editeur visuel pour sections Parcours
  - [x] Champs : Titre, Sous-titre, Duree, Etapes (liste), Bouton CTA
  - [x] Interface ultra-simple et intuitive
  - [x] Ajout/suppression d'etapes
- [x] Creer un editeur visuel pour sections Texte
  - [x] Champs : Titre, Contenu (texte simple)
- [x] Integrer les editeurs dans AdminCMS.tsx
  - [x] Afficher l'editeur approprie selon le type de section
  - [x] Remplacer l'edition JSON brute par des formulaires visuels
- [x] Tester les editeurs
  - [x] Creation reussie d'une section Parcours avec titre "Devenir formateur expert"
  - [x] Ajout d'etapes ("Pedagogie avancee" avec description)
  - [x] Verifier que les changements sont sauvegardes et affiches correctement
  - [x] Affichage correct sur la page Parcours
- [x] Creer un checkpoint


## Phase 12 - Interface d'Administration des Parcours COMPLET

### Objectif
Creer une interface d'administration simple et intuitive pour modifier les parcours (titres, descriptions, durees, etapes) sans JSON ni problemes de sauvegarde.

### Taches
- [x] Creer une page AdminLearningPaths.tsx
  - [x] Interface simple et ergonomique pour un debutant
  - [x] Affichage de tous les parcours
  - [x] Modification du titre, description, niveau, duree
  - [x] Gestion des etapes (ajout, suppression)
  - [x] Boutons Modifier, Sauvegarder, Annuler
- [x] Integrer la page dans App.tsx
  - [x] Route /admin/parcours
  - [x] Import du composant AdminLearningPaths
- [x] Tester l'interface
  - [x] Modification du titre "Devenir formateur expert" vers "Devenir formateur BAFA"
  - [x] Sauvegarde persistante des modifications
  - [x] Interface ergonomique et intuitive
- [x] Creer un checkpoint

## Phase 13 - Ajout des Ressources PDF depuis Google Drive ✅ COMPLÉTÉ

### Objectif
Ajouter les ressources PDF depuis Google Drive dans l'admin de la Ressourcerie IFAC avec les bonnes permissions par profil.

### Tâches
- [x] Recevoir le fichier ZIP avec les ressources PDF (110 PDFs)
- [x] Extraire les fichiers et explorer la structure
- [x] Créer la procédure tRPC admin.importPDFBulk pour importer en masse
- [x] Créer la page admin /admin/import-pdfs avec interface intuitive
- [x] Générer le fichier JSON avec les 110 ressources
- [x] Copier le fichier JSON vers le dossier public
- [x] Ajouter la route /admin/import-pdfs dans App.tsx
- [x] Redémarrer le serveur
- [x] Importer les 110 ressources directement en base de données
- [x] Vérifier que les ressources s'affichent correctement
- [ ] Créer un checkpoint


## Phase 14 - Organiser les ressources par catégories et uploader les PDFs

### Objectif
Organiser les 110 ressources par catégories thématiques et uploader les fichiers PDF vers S3.

### Tâches
- [ ] Créer les catégories/collections thématiques
  - [ ] Activités manuelles
  - [ ] Jeux et divertissements
  - [ ] Recettes et cuisine
  - [ ] Ressources pour formateurs
  - [ ] Livrets et guides
  - [ ] Récupération et matériel
- [ ] Uploader les fichiers PDF vers S3
- [ ] Mettre à jour les URLs des ressources
- [ ] Vérifier que les ressources s'affichent correctement
- [ ] Créer un checkpoint
