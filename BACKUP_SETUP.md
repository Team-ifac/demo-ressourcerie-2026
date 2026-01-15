# Configuration des Backups Automatiques

## Guide de configuration des sauvegardes pour la Ressourcerie IFAC

### 1. Stratégie de Backup

#### Fréquence des backups
- **Quotidiens** : Sauvegarde complète chaque jour à 02:00 UTC
- **Hebdomadaires** : Archive complète chaque dimanche
- **Mensuels** : Archive d'archivage le 1er de chaque mois

#### Rétention des backups
- Backups quotidiens : 30 jours
- Backups hebdomadaires : 90 jours
- Backups mensuels : 1 an

### 2. Backup de la Base de Données

#### Configuration automatique
```bash
# Backup automatique avec mysqldump
0 2 * * * mysqldump -u root -p$DB_PASSWORD ressourcerie_ifac > /backups/db-$(date +\%Y\%m\%d).sql

# Compression du backup
0 3 * * * gzip /backups/db-$(date -d yesterday +\%Y\%m\%d).sql
```

#### Restauration d'une sauvegarde
```bash
# Restaurer depuis un backup
gunzip < /backups/db-20250101.sql.gz | mysql -u root -p$DB_PASSWORD ressourcerie_ifac

# Vérifier l'intégrité du backup
mysqlcheck -u root -p$DB_PASSWORD ressourcerie_ifac
```

### 3. Backup du Stockage S3

#### Configuration S3
```bash
# Backup automatique vers S3
0 4 * * * aws s3 sync /data/uploads s3://ressourcerie-ifac-backups/uploads/ --delete

# Versioning S3
aws s3api put-bucket-versioning \
  --bucket ressourcerie-ifac-backups \
  --versioning-configuration Status=Enabled
```

#### Restauration depuis S3
```bash
# Restaurer les fichiers depuis S3
aws s3 sync s3://ressourcerie-ifac-backups/uploads/ /data/uploads/

# Lister les versions d'un fichier
aws s3api list-object-versions \
  --bucket ressourcerie-ifac-backups \
  --prefix uploads/
```

### 4. Backup des Fichiers de Configuration

#### Fichiers à sauvegarder
```
.env.production
nginx.conf
docker-compose.yml
server/config/
client/public/
```

#### Script de backup
```bash
#!/bin/bash
BACKUP_DIR="/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)

# Créer le répertoire de backup
mkdir -p $BACKUP_DIR

# Sauvegarder les fichiers de configuration
tar -czf $BACKUP_DIR/config-$DATE.tar.gz \
  .env.production \
  nginx.conf \
  docker-compose.yml \
  server/config/ \
  client/public/

# Supprimer les anciens backups (>30 jours)
find $BACKUP_DIR -name "config-*.tar.gz" -mtime +30 -delete
```

### 5. Backup des Logs

#### Configuration des logs
```bash
# Rotation des logs
0 0 * * * logrotate /etc/logrotate.d/ressourcerie-ifac

# Archivage des logs
0 1 * * * tar -czf /backups/logs/logs-$(date +\%Y\%m\%d).tar.gz /var/log/ressourcerie-ifac/
```

### 6. Monitoring des Backups

#### Vérification de l'intégrité
```bash
#!/bin/bash
# Vérifier que le backup a été créé
BACKUP_FILE="/backups/db-$(date -d yesterday +%Y%m%d).sql.gz"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERREUR: Backup non trouvé: $BACKUP_FILE"
  # Envoyer une alerte
  curl -X POST https://hooks.slack.com/services/... \
    -d '{"text":"Backup failed for ressourcerie-ifac"}'
fi

# Vérifier la taille du backup
SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "Backup size: $SIZE"

# Tester la restauration (optionnel)
gunzip -t "$BACKUP_FILE" || echo "ERREUR: Backup corrompu"
```

#### Alertes de backup
```bash
# Envoyer une notification de succès
0 5 * * * curl -X POST https://hooks.slack.com/services/... \
  -d '{"text":"Daily backup completed successfully"}'

# Envoyer une alerte en cas d'échec
*/5 * * * * [ ! -f /tmp/backup_success ] && curl -X POST https://hooks.slack.com/services/... \
  -d '{"text":"Backup failed - immediate action required"}'
```

### 7. Disaster Recovery Plan

#### Scénario 1 : Perte de données
1. Identifier la dernière sauvegarde valide
2. Restaurer la base de données
3. Restaurer les fichiers depuis S3
4. Vérifier l'intégrité des données
5. Notifier les utilisateurs

#### Scénario 2 : Corruption de la base de données
1. Arrêter l'application
2. Restaurer depuis le backup le plus récent
3. Exécuter `mysqlcheck` pour vérifier l'intégrité
4. Redémarrer l'application
5. Monitorer les logs pour les erreurs

#### Scénario 3 : Perte totale du serveur
1. Provisionner une nouvelle instance
2. Restaurer la base de données
3. Restaurer les fichiers depuis S3
4. Restaurer la configuration depuis le backup
5. Redémarrer tous les services

### 8. Checklist de déploiement

- [ ] Backups quotidiens configurés
- [ ] Backups hebdomadaires configurés
- [ ] Backups mensuels configurés
- [ ] S3 versioning activé
- [ ] Monitoring des backups en place
- [ ] Alertes Slack configurées
- [ ] Test de restauration effectué
- [ ] Documentation mise à jour
- [ ] Équipe formée au disaster recovery

### 9. Ressources utiles

- [MySQL Backup Guide](https://dev.mysql.com/doc/refman/8.0/en/backup-and-recovery.html)
- [AWS S3 Backup Best Practices](https://docs.aws.amazon.com/AmazonS3/latest/userguide/BestPractices.html)
- [Disaster Recovery Planning](https://www.digitalocean.com/community/tutorials/disaster-recovery-planning)
