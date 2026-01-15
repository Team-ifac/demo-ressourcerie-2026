# Configuration du Monitoring et des Alertes

## Guide de monitoring pour la Ressourcerie IFAC

### 1. Métriques de Performance

#### Core Web Vitals
- **LCP (Largest Contentful Paint)** : < 2.5s
- **FID (First Input Delay)** : < 100ms
- **CLS (Cumulative Layout Shift)** : < 0.1

#### Temps de réponse API
- **Requêtes normales** : < 200ms
- **Requêtes complexes** : < 500ms
- **Requêtes lourdes** : < 2s

#### Disponibilité
- **Uptime cible** : 99.9%
- **Downtime acceptable** : 43 minutes/mois
- **Temps de réponse aux incidents** : < 15 minutes

### 2. Monitoring des Erreurs

#### Erreurs JavaScript
```javascript
// Configuration Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
```

#### Erreurs serveur
```bash
# Configuration des logs
ERROR_LOG=/var/log/ressourcerie-ifac/error.log
WARN_LOG=/var/log/ressourcerie-ifac/warn.log
INFO_LOG=/var/log/ressourcerie-ifac/info.log

# Rotation des logs
/var/log/ressourcerie-ifac/*.log {
  daily
  rotate 30
  compress
  delaycompress
  notifempty
  create 0640 www-data www-data
  sharedscripts
  postrotate
    systemctl reload ressourcerie-ifac
  endscript
}
```

### 3. Alertes Slack

#### Configuration des webhooks
```bash
# Erreurs critiques
SLACK_CRITICAL_WEBHOOK=https://hooks.slack.com/services/...

# Avertissements
SLACK_WARNING_WEBHOOK=https://hooks.slack.com/services/...

# Informations
SLACK_INFO_WEBHOOK=https://hooks.slack.com/services/...
```

#### Types d'alertes
```
🔴 CRITIQUE
- Erreur 500 (> 5 en 1 minute)
- Base de données inaccessible
- Disque plein (> 90%)
- Mémoire critique (> 95%)
- Certificat SSL expiring (< 7 jours)

🟡 AVERTISSEMENT
- Erreur 4xx (> 100 en 1 minute)
- Temps de réponse lent (> 2s)
- CPU élevé (> 80%)
- Mémoire élevée (> 80%)
- Backup échoué

🟢 INFORMATION
- Déploiement réussi
- Backup complété
- Certificat renouvelé
- Maintenance planifiée
```

### 4. Dashboard de Monitoring

#### Métriques clés
```
┌─────────────────────────────────────────┐
│ Ressourcerie IFAC - Dashboard           │
├─────────────────────────────────────────┤
│ Uptime: 99.95% ✓                        │
│ Requêtes/s: 145                         │
│ Erreurs/s: 0.2                          │
│ Temps réponse moyen: 145ms              │
│ Utilisateurs actifs: 234                │
│ Ressources: 1,245                       │
│ Commentaires: 3,456                     │
│ Sujets forum: 567                       │
└─────────────────────────────────────────┘
```

#### Graphiques
- Uptime (24h, 7j, 30j)
- Requêtes par seconde
- Erreurs par type
- Temps de réponse
- Utilisation CPU/Mémoire
- Taille de la base de données

### 5. Health Checks

#### Endpoint de santé
```bash
GET /api/health
```

Réponse :
```json
{
  "status": "healthy",
  "timestamp": "2025-01-01T12:00:00Z",
  "uptime": 86400,
  "checks": {
    "database": "ok",
    "cache": "ok",
    "storage": "ok",
    "email": "ok"
  }
}
```

#### Monitoring des services
```bash
# Vérifier la base de données
curl http://localhost:3000/api/health | jq '.checks.database'

# Vérifier le cache
curl http://localhost:3000/api/health | jq '.checks.cache'

# Vérifier le stockage
curl http://localhost:3000/api/health | jq '.checks.storage'
```

### 6. Alertes Automatiques

#### Script de monitoring
```bash
#!/bin/bash
# Vérifier l'uptime
UPTIME=$(curl -s http://localhost:3000/api/health | jq '.uptime')

if [ "$UPTIME" -lt 300 ]; then
  # Alerte: service redémarré récemment
  curl -X POST $SLACK_WARNING_WEBHOOK \
    -d '{"text":"Service restarted recently"}'
fi

# Vérifier les erreurs
ERRORS=$(curl -s http://localhost:3000/api/health | jq '.checks | to_entries | map(select(.value != "ok")) | length')

if [ "$ERRORS" -gt 0 ]; then
  # Alerte: services en erreur
  curl -X POST $SLACK_CRITICAL_WEBHOOK \
    -d "{\"text\":\"$ERRORS service(s) down\"}"
fi
```

### 7. Rapports de Monitoring

#### Rapport hebdomadaire
```
Semaine du 01/01/2025

Uptime: 99.98%
Requêtes totales: 1,234,567
Erreurs: 245 (0.02%)
Utilisateurs actifs: 456
Ressources créées: 23
Commentaires: 156

Incidents:
- Aucun incident critique
- 1 avertissement: Temps de réponse élevé (2.3s) le 03/01

Recommandations:
- Optimiser les requêtes lentes
- Augmenter la capacité de cache
```

#### Rapport mensuel
```
Mois de janvier 2025

Uptime: 99.95%
Requêtes totales: 45,678,901
Erreurs: 4,567 (0.01%)
Utilisateurs actifs: 2,345
Ressources créées: 234
Commentaires: 5,678

Incidents majeurs:
- 01/15: Outage 2h (mise à jour serveur)
- 01/22: Dégradation performance 30min

Améliorations:
- Optimisation des requêtes DB
- Augmentation du cache Redis
- Migration vers CDN global
```

### 8. Checklist de déploiement

- [ ] Sentry configuré et testé
- [ ] Webhooks Slack configurés
- [ ] Health checks en place
- [ ] Logs centralisés
- [ ] Alertes configurées
- [ ] Dashboard accessible
- [ ] Équipe formée au monitoring
- [ ] Runbooks documentés

### 9. Ressources utiles

- [Sentry Documentation](https://docs.sentry.io/)
- [Prometheus Monitoring](https://prometheus.io/)
- [Grafana Dashboards](https://grafana.com/)
- [ELK Stack](https://www.elastic.co/what-is/elk-stack)
