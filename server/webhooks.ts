// Webhooks system for triggering notifications and emails

export type WebhookEvent = 
  | "resource.created"
  | "resource.updated"
  | "resource.deleted"
  | "comment.created"
  | "comment.deleted"
  | "forum.topic.created"
  | "forum.reply.created"
  | "collection.created"
  | "tag.created";

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: number;
  userId: number;
  data: Record<string, any>;
}

export interface Webhook {
  id: number;
  userId: number;
  url: string;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: Date;
  lastTriggeredAt?: Date;
}

/**
 * Déclenche un événement webhook
 */
export async function triggerWebhook(event: WebhookEvent, userId: number, data: Record<string, any>) {
  const payload: WebhookPayload = {
    event,
    timestamp: Date.now(),
    userId,
    data,
  };

  // Envoyer les notifications aux utilisateurs intéressés
  await sendWebhookNotifications(event, userId, data);

  // Envoyer les emails de notification
  await sendEmailNotifications(event, userId, data);

  console.log(`[Webhook] Event triggered: ${event}`, payload);
}

/**
 * Envoie les notifications WebSocket
 */
async function sendWebhookNotifications(event: WebhookEvent, userId: number, data: Record<string, any>) {
  let targetUserIds: number[] = [];

  switch (event) {
    case "comment.created":
      // Notifier le créateur de la ressource
      targetUserIds = [data.resourceOwnerId];
      break;

    case "forum.reply.created":
      // Notifier le créateur du sujet et les autres répondants
      targetUserIds = [data.topicCreatorId, ...data.otherReplierIds];
      break;

    case "resource.created":
      // Notifier les followers de la catégorie
      targetUserIds = data.categoryFollowerIds || [];
      break;

    case "collection.created":
      // Notifier si c'est une collection publique
      if (data.isPublic) {
        targetUserIds = data.followerIds || [];
      }
      break;
  }

  // Créer les notifications pour chaque utilisateur cible
  for (const targetUserId of targetUserIds) {
    if (targetUserId !== userId) {
      // Ne pas notifier l'utilisateur qui a déclenché l'événement
      await createNotification(targetUserId, event, data);
    }
  }
}

/**
 * Crée une notification pour un utilisateur
 */
async function createNotification(userId: number, event: WebhookEvent, data: Record<string, any>) {
  const notificationMessages: Record<WebhookEvent, string> = {
    "resource.created": `Nouvelle ressource: ${data.title}`,
    "resource.updated": `Ressource mise à jour: ${data.title}`,
    "resource.deleted": `Ressource supprimée: ${data.title}`,
    "comment.created": `Nouveau commentaire sur: ${data.resourceTitle}`,
    "comment.deleted": `Commentaire supprimé`,
    "forum.topic.created": `Nouveau sujet: ${data.topicTitle}`,
    "forum.reply.created": `Nouvelle réponse à: ${data.topicTitle}`,
    "collection.created": `Nouvelle collection: ${data.collectionName}`,
    "tag.created": `Nouveau tag: ${data.tagName}`,
  };

  try {
    // Créer une notification via la procédure tRPC
    console.log(`[Notification] Created for user ${userId}: ${notificationMessages[event]}`);
  } catch (error) {
    console.error(`[Webhook] Failed to create notification for user ${userId}:`, error);
  }
}

/**
 * Envoie les emails de notification
 */
async function sendEmailNotifications(event: WebhookEvent, userId: number, data: Record<string, any>) {
  // Cette fonction sera implémentée avec un service d'email
  // Pour l'instant, on log simplement
  console.log(`[Email Notification] Event: ${event}, User: ${userId}`);

  // Exemple d'implémentation future:
  // await emailService.send({
  //   to: userEmail,
  //   template: getEmailTemplate(event),
  //   data,
  // });
}

/**
 * Récupère les webhooks actifs d'un utilisateur
 */
export async function getUserWebhooks(userId: number): Promise<Webhook[]> {
  // À implémenter avec la base de données
  return [];
}

/**
 * Crée un nouveau webhook
 */
export async function createWebhook(
  userId: number,
  url: string,
  events: WebhookEvent[]
): Promise<Webhook> {
  // À implémenter avec la base de données
  return {
    id: 1,
    userId,
    url,
    events,
    isActive: true,
    createdAt: new Date(),
  };
}

/**
 * Supprime un webhook
 */
export async function deleteWebhook(webhookId: number, userId: number): Promise<boolean> {
  // À implémenter avec la base de données
  return true;
}

/**
 * Teste un webhook
 */
export async function testWebhook(webhookId: number): Promise<boolean> {
  const payload: WebhookPayload = {
    event: "resource.created",
    timestamp: Date.now(),
    userId: 0,
    data: {
      id: 1,
      title: "Test Resource",
      description: "This is a test webhook payload",
    },
  };

  try {
    // À implémenter avec un vrai appel HTTP
    console.log(`[Webhook Test] Payload:`, payload);
    return true;
  } catch (error) {
    console.error(`[Webhook Test] Failed:`, error);
    return false;
  }
}
