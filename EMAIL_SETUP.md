# Configuration des emails pour la Ressourcerie IFAC

## Guide de configuration des services d'email

Ce guide explique comment configurer un service d'email pour envoyer les notifications d'adhésion.

### Options disponibles

Nous recommandons l'une de ces solutions :

1. **SendGrid** - Service d'email professionnel (recommandé)
2. **Mailgun** - Alternative populaire
3. **Resend** - Service moderne et simple
4. **AWS SES** - Solution économique pour gros volumes

### Option 1 : SendGrid (Recommandé)

#### Étape 1 : Créer un compte SendGrid

1. Allez sur [sendgrid.com](https://sendgrid.com)
2. Cliquez sur "Sign up" et créez un compte
3. Vérifiez votre adresse email
4. Complétez votre profil

#### Étape 2 : Obtenir la clé API

1. Connectez-vous à votre tableau de bord SendGrid
2. Allez dans **Settings** → **API Keys**
3. Cliquez sur **Create API Key**
4. Donnez-lui un nom : "Ressourcerie IFAC"
5. Sélectionnez les permissions : "Mail Send"
6. Cliquez sur **Create & View**
7. Copiez la clé API

#### Étape 3 : Configurer l'adresse d'envoi

1. Allez dans **Settings** → **Sender Authentication**
2. Cliquez sur **Verify a Single Sender**
3. Remplissez les informations :
   - **From Email Address** : noreply@ressourcerie-ifac.fr
   - **From Name** : Ressourcerie IFAC
   - **Reply To** : contact@ressourcerie-ifac.fr
4. Vérifiez l'adresse email

#### Étape 4 : Ajouter la clé API aux variables d'environnement

```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@ressourcerie-ifac.fr
SENDGRID_FROM_NAME=Ressourcerie IFAC
```

#### Étape 5 : Implémenter l'intégration SendGrid

Installez le package SendGrid :

```bash
pnpm add @sendgrid/mail
```

Mettez à jour `server/email.ts` :

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export async function sendSubscriptionConfirmationEmail(
  email: string,
  userId: number
): Promise<void> {
  try {
    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@ressourcerie-ifac.fr',
      subject: 'Bienvenue sur la Ressourcerie IFAC - Adhésion confirmée',
      html: `
        <h1>Bienvenue sur la Ressourcerie IFAC</h1>
        <p>Votre adhésion a été confirmée avec succès !</p>
        <p>Vous avez maintenant accès à :</p>
        <ul>
          <li>Toutes les ressources pédagogiques premium</li>
          <li>Les fiches d'activités complètes</li>
          <li>Les kits clé en main</li>
          <li>Les articles et guides approfondis</li>
        </ul>
        <a href="https://ressourcerie-ifac.fr/resources">Commencer l'exploration</a>
      `,
    });

    console.log(`[Email] Subscription confirmation sent to ${email}`);
  } catch (error) {
    console.error('[Email] Error sending subscription confirmation:', error);
    throw error;
  }
}
```

### Option 2 : Mailgun

#### Étape 1 : Créer un compte Mailgun

1. Allez sur [mailgun.com](https://mailgun.com)
2. Cliquez sur "Sign up" et créez un compte
3. Vérifiez votre adresse email

#### Étape 2 : Obtenir les clés API

1. Connectez-vous à votre tableau de bord Mailgun
2. Allez dans **API** → **API Keys**
3. Copiez votre **Private API Key**
4. Notez votre **Domain** (ex: `mg.ressourcerie-ifac.fr`)

#### Étape 3 : Vérifier votre domaine

1. Allez dans **Domains**
2. Cliquez sur **Add New Domain**
3. Entrez votre domaine
4. Suivez les instructions pour ajouter les enregistrements DNS

#### Étape 4 : Ajouter les clés API aux variables d'environnement

```
MAILGUN_API_KEY=key-xxxxxxxxxxxxx
MAILGUN_DOMAIN=mg.ressourcerie-ifac.fr
MAILGUN_FROM_EMAIL=noreply@ressourcerie-ifac.fr
```

### Option 3 : Resend

#### Étape 1 : Créer un compte Resend

1. Allez sur [resend.com](https://resend.com)
2. Cliquez sur "Sign up" et créez un compte
3. Vérifiez votre adresse email

#### Étape 2 : Obtenir la clé API

1. Allez dans **API Keys**
2. Cliquez sur **Create API Key**
3. Copiez la clé

#### Étape 3 : Ajouter la clé API aux variables d'environnement

```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@ressourcerie-ifac.fr
```

### Tester les emails

#### En développement

1. Utilisez une adresse email de test
2. Vérifiez que l'email est reçu
3. Vérifiez le contenu et la mise en forme

#### En production

1. Testez avec une vraie adresse email
2. Vérifiez que l'email arrive rapidement
3. Vérifiez la délivrabilité

### Modèles d'email

#### Email de confirmation d'adhésion

**Sujet :** Bienvenue sur la Ressourcerie IFAC - Adhésion confirmée

**Contenu :**
```
Bonjour [NOM],

Votre adhésion à la Ressourcerie IFAC a été confirmée avec succès !

Vous avez maintenant accès à :
- Toutes les ressources pédagogiques premium
- Les fiches d'activités complètes
- Les kits clé en main
- Les articles et guides approfondis

Commencer l'exploration : [LIEN]

Cordialement,
L'équipe IFAC
```

#### Email de renouvellement d'adhésion

**Sujet :** Votre adhésion à la Ressourcerie IFAC a été renouvelée

**Contenu :**
```
Bonjour [NOM],

Votre adhésion à la Ressourcerie IFAC a été renouvelée avec succès !

Vous continuez à avoir accès à toutes les ressources pédagogiques premium.

Merci de votre confiance !

Cordialement,
L'équipe IFAC
```

#### Email d'échec de paiement

**Sujet :** Problème de paiement - Action requise

**Contenu :**
```
Bonjour [NOM],

Nous avons rencontré un problème lors du traitement de votre paiement d'adhésion.

Veuillez mettre à jour vos informations de paiement pour continuer à accéder aux ressources premium.

Mettre à jour le paiement : [LIEN]

Si vous avez des questions, veuillez nous contacter.

Cordialement,
L'équipe IFAC
```

### Dépannage

#### Les emails ne sont pas envoyés

- Vérifiez que la clé API est correcte
- Vérifiez que l'adresse d'envoi est vérifiée
- Vérifiez les logs du serveur pour les erreurs
- Vérifiez les logs du service d'email

#### Les emails vont en spam

- Vérifiez les enregistrements SPF et DKIM
- Utilisez un domaine personnalisé (pas un sous-domaine)
- Incluez un lien de désinscription
- Utilisez un contenu de qualité

#### Les emails arrivent lentement

- Vérifiez la charge du service d'email
- Vérifiez la connexion réseau
- Vérifiez les logs du serveur

### Ressources utiles

- [Documentation SendGrid](https://docs.sendgrid.com)
- [Documentation Mailgun](https://documentation.mailgun.com)
- [Documentation Resend](https://resend.com/docs)
- [Meilleures pratiques d'email](https://www.mailgun.com/blog/email/)
