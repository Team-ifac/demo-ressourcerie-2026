# Configuration du Domaine et SSL/TLS

## Guide de configuration pour la Ressourcerie IFAC

### 1. Configuration du Domaine Personnalisé

#### Étape 1 : Enregistrement du domaine
1. Achetez un domaine auprès d'un registrar (GoDaddy, Namecheap, OVH, etc.)
2. Notez les serveurs de noms fournis par votre hébergeur Manus

#### Étape 2 : Configuration DNS
1. Connectez-vous à votre registrar
2. Accédez aux paramètres DNS
3. Ajoutez les enregistrements suivants :

```
Type: A
Name: @
Value: [IP fournie par Manus]
TTL: 3600

Type: CNAME
Name: www
Value: ressourcerie-ifac.manus.space
TTL: 3600
```

#### Étape 3 : Vérification DNS
```bash
# Vérifiez la propagation DNS
nslookup ressourcerie-ifac.com
dig ressourcerie-ifac.com
```

### 2. Configuration SSL/TLS

#### Certificat SSL Automatique
Manus fournit automatiquement un certificat SSL/TLS gratuit via Let's Encrypt :

1. **Activation automatique** : Une fois le domaine configuré, Manus génère automatiquement le certificat
2. **Renouvellement automatique** : Les certificats sont renouvelés automatiquement 30 jours avant expiration
3. **Vérification** : Visitez `https://ressourcerie-ifac.com` pour vérifier le certificat

#### Configuration du fichier .env
```env
# Domaine personnalisé
VITE_APP_URL=https://ressourcerie-ifac.com
VITE_API_URL=https://api.ressourcerie-ifac.com

# Force HTTPS
NODE_ENV=production
```

#### Headers de sécurité
Les headers suivants sont automatiquement configurés :

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. Redirection HTTP vers HTTPS

Manus configure automatiquement la redirection :
- `http://ressourcerie-ifac.com` → `https://ressourcerie-ifac.com`
- `http://www.ressourcerie-ifac.com` → `https://ressourcerie-ifac.com`

### 4. Configuration CDN et Cache

#### Cache des assets statiques
```
Cache-Control: public, max-age=31536000, immutable
```

#### Cache des pages dynamiques
```
Cache-Control: public, max-age=3600, s-maxage=86400
```

### 5. Monitoring du Certificat SSL

#### Vérification de l'expiration
```bash
# Vérifiez l'expiration du certificat
openssl s_client -connect ressourcerie-ifac.com:443 -showcerts | grep "notAfter"
```

#### Alertes d'expiration
- Les alertes sont envoyées 30 jours avant l'expiration
- Les alertes sont envoyées 7 jours avant l'expiration
- Les alertes sont envoyées 1 jour avant l'expiration

### 6. Troubleshooting

#### Certificat non valide
1. Vérifiez que le domaine est correctement configuré en DNS
2. Attendez 24-48h pour la propagation DNS complète
3. Contactez le support Manus si le problème persiste

#### Redirection non fonctionnelle
1. Vérifiez les enregistrements DNS
2. Videz le cache du navigateur (Ctrl+Shift+Delete)
3. Testez avec un autre navigateur

#### Mixed Content (HTTP/HTTPS)
1. Vérifiez que tous les assets utilisent HTTPS
2. Mettez à jour les URLs hardcodées
3. Utilisez les variables d'environnement pour les URLs

### 7. Checklist de déploiement

- [ ] Domaine enregistré et configuré
- [ ] Enregistrements DNS propagés (vérifier avec `nslookup`)
- [ ] Certificat SSL actif et valide
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] Headers de sécurité configurés
- [ ] Cache configuré correctement
- [ ] Tests HTTPS passants
- [ ] Certificat dans les favoris du navigateur

### 8. Ressources utiles

- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs](https://www.ssllabs.com/ssltest/)
- [Mozilla Observatory](https://observatory.mozilla.org/)
- [HTTPS Everywhere](https://www.eff.org/https-everywhere)
