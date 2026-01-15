# Guide d'Administration

## Guide complet d'administration de la Ressourcerie IFAC

### 1. Accès Admin

#### Connexion
1. Visitez `https://ressourcerie-ifac.com/admin`
2. Connectez-vous avec vos identifiants
3. Vérifiez votre identité via 2FA si activé

#### Rôles et permissions
- **Admin** : Accès complet à tous les modules
- **Modérateur** : Gestion des ressources et commentaires
- **Contributeur** : Création de ressources
- **Utilisateur** : Consultation et commentaires

### 2. Gestion des Ressources

#### Créer une ressource
1. Allez à "Ressources" → "Nouvelle ressource"
2. Remplissez les champs obligatoires
3. Ajoutez les tags et la thématique
4. Uploadez les fichiers (PDF, images)
5. Publiez ou enregistrez en brouillon

#### Modérer les ressources
1. Allez à "Modération" → "Ressources en attente"
2. Vérifiez le contenu
3. Approuvez ou refusez
4. Laissez un commentaire si nécessaire

#### Supprimer une ressource
1. Allez à "Ressources"
2. Sélectionnez la ressource
3. Cliquez sur "Supprimer"
4. Confirmez la suppression
5. La ressource est archivée (non supprimée définitivement)

### 3. Gestion des Utilisateurs

#### Promouvoir un utilisateur
1. Allez à "Utilisateurs"
2. Sélectionnez l'utilisateur
3. Changez le rôle
4. Cliquez sur "Enregistrer"

#### Suspendre un utilisateur
1. Allez à "Utilisateurs"
2. Sélectionnez l'utilisateur
3. Cliquez sur "Suspendre"
4. Entrez la durée (jours)
5. Confirmez

#### Supprimer un utilisateur
1. Allez à "Utilisateurs"
2. Sélectionnez l'utilisateur
3. Cliquez sur "Supprimer"
4. Confirmez (données anonymisées)

### 4. Modération du Contenu

#### Signalements
1. Allez à "Modération" → "Signalements"
2. Lisez le rapport
3. Prenez une action :
   - Rejeter le signalement
   - Avertir l'utilisateur
   - Supprimer le contenu
   - Suspendre l'utilisateur

#### Commentaires
1. Allez à "Modération" → "Commentaires"
2. Filtrez par statut (approuvé, en attente, refusé)
3. Approuvez ou refusez les commentaires
4. Supprimez les commentaires inappropriés

#### Forum
1. Allez à "Modération" → "Forum"
2. Vérifiez les nouveaux sujets
3. Fermez les sujets si nécessaire
4. Épinglez les sujets importants

### 5. Analytics et Rapports

#### Dashboard Analytics
1. Allez à "Analytics"
2. Consultez les statistiques clés :
   - Utilisateurs actifs
   - Ressources consultées
   - Commentaires
   - Téléchargements

#### Rapports personnalisés
1. Allez à "Rapports"
2. Créez un nouveau rapport
3. Sélectionnez les métriques
4. Définissez la période
5. Générez le rapport PDF

#### Export de données
1. Allez à "Données"
2. Sélectionnez le type d'export
3. Choisissez la période
4. Cliquez sur "Exporter"
5. Téléchargez le fichier CSV/JSON

### 6. Configuration des Intégrations

#### Slack
1. Allez à "Intégrations" → "Slack"
2. Entrez l'URL du webhook
3. Sélectionnez les événements
4. Testez la connexion
5. Enregistrez

#### Discord
1. Allez à "Intégrations" → "Discord"
2. Entrez l'URL du webhook
3. Sélectionnez les événements
4. Testez la connexion
5. Enregistrez

#### Stripe
1. Allez à "Intégrations" → "Stripe"
2. Entrez la clé secrète
3. Configurez les plans
4. Testez les paiements
5. Enregistrez

#### Google Analytics
1. Allez à "Intégrations" → "Google Analytics"
2. Entrez l'ID de mesure
3. Configurez les événements
4. Testez le suivi
5. Enregistrez

### 7. Maintenance

#### Backups
1. Allez à "Maintenance" → "Backups"
2. Consultez l'historique des backups
3. Créez un backup manuel si nécessaire
4. Restaurez depuis un backup si nécessaire

#### Logs
1. Allez à "Maintenance" → "Logs"
2. Filtrez par niveau (ERROR, WARN, INFO)
3. Recherchez des erreurs
4. Exportez les logs si nécessaire

#### Performance
1. Allez à "Maintenance" → "Performance"
2. Consultez les métriques :
   - Temps de réponse
   - Utilisation CPU/Mémoire
   - Taille de la base de données
3. Optimisez si nécessaire

### 8. Sécurité

#### Authentification 2FA
1. Allez à "Sécurité" → "2FA"
2. Activez TOTP
3. Scannez le QR code
4. Entrez le code de vérification
5. Enregistrez les codes de secours

#### Audit des accès
1. Allez à "Sécurité" → "Audit"
2. Consultez l'historique des connexions
3. Vérifiez les actions sensibles
4. Identifiez les activités suspectes

#### Gestion des sessions
1. Allez à "Sécurité" → "Sessions"
2. Consultez les sessions actives
3. Déconnectez les sessions suspectes
4. Définissez le timeout de session

### 9. Checklist de Maintenance Hebdomadaire

- [ ] Vérifier les signalements en attente
- [ ] Approuver les ressources en attente
- [ ] Consulter les logs d'erreur
- [ ] Vérifier l'uptime
- [ ] Consulter les statistiques d'utilisation
- [ ] Vérifier les backups
- [ ] Tester les intégrations
- [ ] Répondre aux messages de support

### 10. Checklist de Maintenance Mensuelle

- [ ] Rapport d'activité
- [ ] Audit de sécurité
- [ ] Optimisation des performances
- [ ] Mise à jour des dépendances
- [ ] Nettoyage des données anciennes
- [ ] Formation de l'équipe
- [ ] Planification des améliorations
- [ ] Archivage des logs

### 11. Troubleshooting

#### Problème : Ressource ne s'affiche pas
1. Vérifiez le statut (brouillon, approuvé, refusé)
2. Vérifiez les permissions de l'utilisateur
3. Vérifiez les filtres appliqués
4. Vérifiez les logs d'erreur

#### Problème : Utilisateur ne peut pas se connecter
1. Vérifiez que le compte n'est pas suspendu
2. Réinitialisez le mot de passe
3. Vérifiez le 2FA
4. Vérifiez les logs d'authentification

#### Problème : Intégration ne fonctionne pas
1. Vérifiez la configuration
2. Testez la connexion
3. Vérifiez les logs d'erreur
4. Contactez le support du service

### 12. Ressources utiles

- [Documentation utilisateur](./DOCUMENTATION.md)
- [Guide de déploiement](./DEPLOYMENT.md)
- [Configuration du domaine](./DOMAIN_SETUP.md)
- [Configuration des backups](./BACKUP_SETUP.md)
- [Configuration du monitoring](./MONITORING_SETUP.md)
