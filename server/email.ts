/**
 * Email Service - Gère l'envoi des emails transactionnels
 * Intégration avec SendGrid, Mailgun ou autre service d'email
 */

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
}

export interface EmailOptions {
  to: string;
  template: string;
  data: Record<string, any>;
}

/**
 * Modèles d'email disponibles
 */
const emailTemplates: Record<string, EmailTemplate> = {
  comment_notification: {
    name: "comment_notification",
    subject: "Nouveau commentaire sur votre ressource",
    html: `
      <h2>Nouveau commentaire</h2>
      <p>{{author}} a commenté votre ressource "{{resourceTitle}}"</p>
      <p>{{comment}}</p>
      <a href="{{resourceUrl}}">Voir la ressource</a>
    `,
  },
  forum_reply_notification: {
    name: "forum_reply_notification",
    subject: "Nouvelle réponse à votre sujet",
    html: `
      <h2>Nouvelle réponse au forum</h2>
      <p>{{author}} a répondu à votre sujet "{{topicTitle}}"</p>
      <p>{{reply}}</p>
      <a href="{{forumUrl}}">Voir le forum</a>
    `,
  },
  resource_approved: {
    name: "resource_approved",
    subject: "Votre ressource a été approuvée",
    html: `
      <h2>Ressource approuvée</h2>
      <p>Votre ressource "{{resourceTitle}}" a été approuvée et est maintenant visible sur la plateforme.</p>
      <a href="{{resourceUrl}}">Voir votre ressource</a>
    `,
  },
  resource_rejected: {
    name: "resource_rejected",
    subject: "Votre ressource n'a pas été approuvée",
    html: `
      <h2>Ressource non approuvée</h2>
      <p>Votre ressource "{{resourceTitle}}" n'a pas pu être approuvée.</p>
      <p>Raison : {{reason}}</p>
      <p>Vous pouvez soumettre une nouvelle version en corrigeant les points mentionnés.</p>
    `,
  },
  welcome_email: {
    name: "welcome_email",
    subject: "Bienvenue sur la Ressourcerie IFAC",
    html: `
      <h2>Bienvenue {{name}} !</h2>
      <p>Nous sommes heureux de vous accueillir sur la Ressourcerie IFAC.</p>
      <p>Vous pouvez maintenant :</p>
      <ul>
        <li>Explorer nos ressources pédagogiques</li>
        <li>Partager vos propres ressources</li>
        <li>Participer au forum d'entraide</li>
        <li>Créer vos collections personnalisées</li>
      </ul>
      <a href="{{platformUrl}}">Commencer l'exploration</a>
    `,
  },
  password_reset: {
    name: "password_reset",
    subject: "Réinitialisation de votre mot de passe",
    html: `
      <h2>Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <a href="{{resetUrl}}">Réinitialiser mon mot de passe</a>
      <p>Ce lien expire dans 24 heures.</p>
    `,
  },
  collection_shared: {
    name: "collection_shared",
    subject: "{{author}} a partagé une collection avec vous",
    html: `
      <h2>Collection partagée</h2>
      <p>{{author}} a partagé la collection "{{collectionName}}" avec vous.</p>
      <p>{{description}}</p>
      <a href="{{collectionUrl}}">Voir la collection</a>
    `,
  },
  daily_digest: {
    name: "daily_digest",
    subject: "Votre résumé quotidien de la Ressourcerie IFAC",
    html: `
      <h2>Résumé quotidien</h2>
      <p>Voici les ressources et discussions qui pourraient vous intéresser :</p>
      <h3>Nouvelles ressources</h3>
      {{newResources}}
      <h3>Discussions populaires</h3>
      {{popularDiscussions}}
      <a href="{{platformUrl}}">Voir plus</a>
    `,
  },
};

/**
 * Envoie un email transactionnel
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const template = emailTemplates[options.template];
    if (!template) {
      console.error(`Template email non trouvé: ${options.template}`);
      return false;
    }

    // Remplacer les variables dans le template
    let html = template.html;
    let subject = template.subject;

    Object.entries(options.data).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      html = html.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    });

    // Envoyer l'email via le service configuré
    // Pour l'instant, on log simplement
    console.log(`[Email] Envoi à ${options.to}`);
    console.log(`[Email] Sujet: ${subject}`);
    console.log(`[Email] Template: ${options.template}`);

    // Implémentation future avec SendGrid/Mailgun:
    // const result = await emailService.send({
    //   to: options.to,
    //   subject,
    //   html,
    // });
    // return result.success;

    return true;
  } catch (error) {
    console.error(`[Email] Erreur lors de l'envoi:`, error);
    return false;
  }
}

/**
 * Envoie une notification de commentaire
 */
export async function sendCommentNotification(
  userEmail: string,
  resourceTitle: string,
  authorName: string,
  comment: string,
  resourceUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "comment_notification",
    data: {
      resourceTitle,
      author: authorName,
      comment,
      resourceUrl,
    },
  });
}

/**
 * Envoie une notification de réponse au forum
 */
export async function sendForumReplyNotification(
  userEmail: string,
  topicTitle: string,
  authorName: string,
  reply: string,
  forumUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "forum_reply_notification",
    data: {
      topicTitle,
      author: authorName,
      reply,
      forumUrl,
    },
  });
}

/**
 * Envoie une notification d'approbation de ressource
 */
export async function sendResourceApprovedEmail(
  userEmail: string,
  resourceTitle: string,
  resourceUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "resource_approved",
    data: {
      resourceTitle,
      resourceUrl,
    },
  });
}

/**
 * Envoie une notification de rejet de ressource
 */
export async function sendResourceRejectedEmail(
  userEmail: string,
  resourceTitle: string,
  reason: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "resource_rejected",
    data: {
      resourceTitle,
      reason,
    },
  });
}

/**
 * Envoie un email de bienvenue
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  platformUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "welcome_email",
    data: {
      name: userName,
      platformUrl,
    },
  });
}

/**
 * Envoie un email de partage de collection
 */
export async function sendCollectionSharedEmail(
  userEmail: string,
  collectionName: string,
  description: string,
  authorName: string,
  collectionUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "collection_shared",
    data: {
      collectionName,
      description,
      author: authorName,
      collectionUrl,
    },
  });
}

/**
 * Envoie un résumé quotidien
 */
export async function sendDailyDigest(
  userEmail: string,
  newResources: string,
  popularDiscussions: string,
  platformUrl: string
): Promise<boolean> {
  return sendEmail({
    to: userEmail,
    template: "daily_digest",
    data: {
      newResources,
      popularDiscussions,
      platformUrl,
    },
  });
}
