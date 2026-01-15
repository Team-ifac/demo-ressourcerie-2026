# Guide de déploiement - Ressourcerie IFAC

Ce document décrit le processus de déploiement de la Ressourcerie IFAC.

## 📋 Prérequis

- Node.js 18+ et pnpm
- Base de données MySQL/TiDB configurée
- Clés d'authentification OAuth Manus
- Certificat SSL valide

## 🚀 Déploiement sur Manus

### 1. Préparation

```bash
# Cloner le repository
git clone <repository-url>
cd ressourcerie-ifac

# Installer les dépendances
pnpm install

# Vérifier les tests
pnpm test

# Vérifier le build
pnpm build
```

### 2. Configuration des variables d'environnement

Assurez-vous que toutes les variables d'environnement sont configurées :

```bash
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key
VITE_FRONTEND_FORGE_API_KEY=your-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

### 3. Migrations de base de données

```bash
# Générer les migrations
pnpm db:generate

# Appliquer les migrations
pnpm db:push
```

### 4. Déploiement

Via l'interface Manus :

1. Accédez au Management UI
2. Cliquez sur le bouton **"Publish"** (en haut à droite)
3. Confirmez le déploiement
4. Attendez que le déploiement soit terminé

Ou via CLI :

```bash
# Créer un checkpoint
pnpm checkpoint:create "Deployment ready"

# Publier
manus publish
```

## 🔍 Vérification post-déploiement

### Checklist

- [ ] La page d'accueil se charge correctement
- [ ] L'authentification fonctionne
- [ ] Les ressources s'affichent
- [ ] La recherche fonctionne
- [ ] Les téléchargements fonctionnent
- [ ] Le dashboard admin est accessible
- [ ] Les emails de notification sont envoyés
- [ ] Les logs ne contiennent pas d'erreurs

### Monitoring

```bash
# Consulter les logs
manus logs

# Vérifier la santé de l'application
curl https://ressourcerie-ifac.manus.space/health

# Vérifier les métriques
manus metrics
```

## 🔄 Rollback

En cas de problème, vous pouvez revenir à une version précédente :

```bash
# Lister les versions disponibles
manus versions list

# Rollback à une version spécifique
manus rollback <version-id>
```

## 📊 Performance

### Optimisations déployées

- **Lazy loading** : Images chargées à la demande
- **Caching** : Données mises en cache côté client
- **Pagination** : Listes paginées pour réduire la charge
- **Compression** : Gzip activé pour les réponses
- **CDN** : Assets servis via CDN Manus

### Métriques cibles

- Temps de chargement initial : < 3s
- Largest Contentful Paint (LCP) : < 2.5s
- First Input Delay (FID) : < 100ms
- Cumulative Layout Shift (CLS) : < 0.1

## 🔐 Sécurité

### Configurations de sécurité

- HTTPS obligatoire
- Headers de sécurité configurés
- CORS restreint aux domaines autorisés
- Rate limiting activé
- SQL injection prevention active
- XSS protection active

### Secrets

Les secrets sont gérés via le Management UI :

1. Allez dans **Settings** > **Secrets**
2. Ajoutez ou modifiez les secrets
3. Les changements sont appliqués automatiquement

## 📝 Logs et monitoring

### Accès aux logs

```bash
# Logs en temps réel
manus logs --follow

# Logs filtrés
manus logs --filter "error"

# Logs d'une période spécifique
manus logs --since "2024-01-01" --until "2024-01-31"
```

### Alertes

Configurez les alertes pour :

- Erreurs serveur (5xx)
- Taux d'erreur élevé
- Latence élevée
- Utilisation CPU/Mémoire

## 🔄 Mise à jour continue

### Processus de mise à jour

1. Créer une branche de développement
2. Implémenter les changements
3. Tester localement
4. Créer un checkpoint
5. Publier via le Management UI

### Versioning

Utilisez le semantic versioning :

- **MAJOR** : Changements incompatibles
- **MINOR** : Nouvelles fonctionnalités
- **PATCH** : Corrections de bugs

## 📞 Support

Pour toute question sur le déploiement :

- Consultez la documentation Manus
- Contactez le support Manus
- Ouvrez une issue sur le repository

---

**Dernière mise à jour** : Décembre 2024
