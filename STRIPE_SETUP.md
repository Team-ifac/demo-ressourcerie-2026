# Configuration Stripe pour la Ressourcerie IFAC

## Guide de configuration Stripe en production

Ce guide explique comment configurer Stripe pour la Ressourcerie IFAC en production.

### Étape 1 : Créer un compte Stripe

1. Allez sur [stripe.com](https://stripe.com)
2. Cliquez sur "Sign up" et créez un compte
3. Complétez votre profil d'entreprise
4. Vérifiez votre adresse email

### Étape 2 : Obtenir les clés API Stripe

1. Connectez-vous à votre tableau de bord Stripe
2. Allez dans **Settings** → **API Keys**
3. Vous verrez deux ensembles de clés :
   - **Publishable Key** (commence par `pk_`)
   - **Secret Key** (commence par `sk_`)

**Important :** Utilisez les clés en **mode production**, pas en mode test.

### Étape 3 : Créer un produit et un prix

1. Allez dans **Products** → **Create product**
2. Remplissez les détails :
   - **Name** : "Adhésion Ressourcerie IFAC"
   - **Description** : "Accès premium aux ressources pédagogiques"
   - **Type** : "Service" (pas "Physical good")
3. Cliquez sur **Create product**
4. Dans la section **Pricing**, cliquez sur **Add price**
5. Configurez le prix :
   - **Billing period** : "Monthly" (mensuel) ou "Yearly" (annuel)
   - **Price** : Entrez le montant (ex: 9.99€/mois)
   - **Currency** : EUR (Euro)
6. Cliquez sur **Save product**
7. Notez le **Price ID** (commence par `price_`)

### Étape 4 : Configurer les variables d'environnement

Mettez à jour les variables d'environnement dans le Management UI :

```
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Où trouver `STRIPE_WEBHOOK_SECRET` :**
1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. Entrez l'URL du webhook : `https://votre-domaine.com/api/stripe/webhook`
4. Sélectionnez les événements :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Cliquez sur **Create endpoint**
6. Cliquez sur l'endpoint créé
7. Allez dans **Signing secret** et cliquez sur **Reveal**
8. Copiez la clé (commence par `whsec_`)

### Étape 5 : Configurer les webhooks en production

#### Ajouter l'endpoint webhook

1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur **Add endpoint**
3. Entrez l'URL du webhook : `https://votre-domaine.com/api/stripe/webhook`
4. Sélectionnez les événements à écouter :
   - ✅ `checkout.session.completed` - Quand un paiement est complété
   - ✅ `customer.subscription.created` - Quand une adhésion est créée
   - ✅ `customer.subscription.updated` - Quand une adhésion est mise à jour
   - ✅ `customer.subscription.deleted` - Quand une adhésion est annulée
   - ✅ `invoice.payment_succeeded` - Quand un paiement réussit
   - ✅ `invoice.payment_failed` - Quand un paiement échoue
5. Cliquez sur **Create endpoint**

#### Tester les webhooks en développement

Utilisez Stripe CLI pour tester les webhooks localement :

```bash
# Installer Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# ou
choco install stripe  # Windows
# ou
curl https://files.stripe.com/stripe-cli/install.sh -O && bash install.sh  # Linux

# Se connecter à Stripe
stripe login

# Écouter les événements
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Déclencher un événement de test
stripe trigger checkout.session.completed
```

### Étape 6 : Tester le flux de paiement

1. Allez sur votre site
2. Connectez-vous avec votre compte utilisateur
3. Cliquez sur "S'abonner" ou "Adhérer"
4. Vous serez redirigé vers Stripe Checkout
5. Utilisez les numéros de carte de test Stripe :
   - **Carte réussie** : `4242 4242 4242 4242`
   - **Carte échouée** : `4000 0000 0000 0002`
   - **Expiration** : 12/25 (ou toute date future)
   - **CVC** : 123 (ou n'importe quel nombre)
6. Complétez le paiement
7. Vérifiez que :
   - ✅ L'adhésion est créée en base de données
   - ✅ Le webhook est déclenché
   - ✅ L'email de confirmation est envoyé
   - ✅ L'utilisateur a accès aux ressources premium

### Étape 7 : Configurer les emails de notification

Voir [EMAIL_SETUP.md](./EMAIL_SETUP.md) pour configurer les emails.

### Étape 8 : Monitoring et maintenance

#### Vérifier les paiements

1. Allez dans **Payments** → **Transactions**
2. Vous verrez tous les paiements réussis et échoués
3. Cliquez sur une transaction pour voir les détails

#### Vérifier les adhésions

1. Allez dans **Customers**
2. Vous verrez tous les clients
3. Cliquez sur un client pour voir ses adhésions

#### Vérifier les webhooks

1. Allez dans **Developers** → **Webhooks**
2. Cliquez sur votre endpoint
3. Vous verrez l'historique des événements envoyés
4. Cliquez sur un événement pour voir les détails

### Étapes de sécurité importantes

1. **Ne jamais commiter les clés API** dans Git
2. **Utiliser des variables d'environnement** pour les clés sensibles
3. **Vérifier les signatures des webhooks** (déjà implémenté)
4. **Utiliser HTTPS** en production
5. **Mettre à jour régulièrement** les dépendances Stripe

### Dépannage

#### Le webhook ne se déclenche pas

- Vérifiez que l'URL du webhook est correcte
- Vérifiez que `STRIPE_WEBHOOK_SECRET` est correct
- Vérifiez les logs du serveur pour les erreurs
- Utilisez Stripe CLI pour tester localement

#### Le paiement échoue

- Vérifiez que `STRIPE_PRICE_ID` est correct
- Vérifiez que le prix existe dans Stripe
- Vérifiez les logs Stripe pour les erreurs
- Assurez-vous que le client a une carte valide

#### L'adhésion n'est pas créée

- Vérifiez que le webhook est reçu
- Vérifiez que la base de données est accessible
- Vérifiez les logs du serveur pour les erreurs

### Ressources utiles

- [Documentation Stripe](https://stripe.com/docs)
- [API Stripe](https://stripe.com/docs/api)
- [Webhooks Stripe](https://stripe.com/docs/webhooks)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
- [Tarification Stripe](https://stripe.com/pricing)
