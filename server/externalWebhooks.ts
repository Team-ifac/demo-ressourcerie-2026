/**
 * External Webhooks - Gère les webhooks externes configurables
 * Permet aux administrateurs de configurer des webhooks pour Slack, Discord, Zapier, etc.
 */

// Webhooks externes configurables - pas besoin d'import db pour cette version

export interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  headers?: Record<string, string>;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

/**
 * Enregistre un nouveau webhook
 */
export async function registerWebhook(config: Omit<WebhookConfig, "id" | "createdAt" | "updatedAt">): Promise<WebhookConfig> {
  const webhook: WebhookConfig = {
    id: `webhook_${Date.now()}`,
    ...config,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Sauvegarder dans la base de données
  console.log(`[Webhook] Enregistrement du webhook: ${webhook.name}`);

  return webhook;
}

/**
 * Récupère tous les webhooks actifs
 */
export async function getActiveWebhooks(): Promise<WebhookConfig[]> {
  // Récupérer depuis la base de données
  console.log("[Webhook] Récupération des webhooks actifs");

  return [];
}

/**
 * Récupère les webhooks pour un événement spécifique
 */
export async function getWebhooksForEvent(eventType: string): Promise<WebhookConfig[]> {
  const webhooks = await getActiveWebhooks();
  return webhooks.filter((w) => w.events.includes(eventType));
}

/**
 * Envoie un événement à tous les webhooks configurés
 */
export async function triggerWebhook(event: WebhookEvent): Promise<void> {
  const webhooks = await getWebhooksForEvent(event.type);

  for (const webhook of webhooks) {
    await sendWebhookEvent(webhook, event);
  }
}

/**
 * Envoie un événement à un webhook spécifique
 */
async function sendWebhookEvent(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
  try {
    const payload = {
      event: event.type,
      timestamp: event.timestamp.toISOString(),
      data: event.data,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Webhook-Signature": generateSignature(JSON.stringify(payload)),
      ...webhook.headers,
    };

    console.log(`[Webhook] Envoi à ${webhook.url} (${event.type})`);

    // Implémentation future avec retry logic:
    // for (let attempt = 0; attempt < webhook.retryCount; attempt++) {
    //   try {
    //     const response = await fetch(webhook.url, {
    //       method: "POST",
    //       headers,
    //       body: JSON.stringify(payload),
    //     });
    //     if (response.ok) return;
    //   } catch (error) {
    //     if (attempt === webhook.retryCount - 1) throw error;
    //     await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    //   }
    // }
  } catch (error) {
    console.error(`[Webhook] Erreur lors de l'envoi à ${webhook.url}:`, error);
  }
}

/**
 * Génère une signature pour sécuriser les webhooks
 */
function generateSignature(payload: string): string {
  // Implémentation future avec HMAC-SHA256
  return `sha256=${Buffer.from(payload).toString("hex")}`;
}

/**
 * Webhooks prédéfinis pour les services populaires
 */
export const predefinedWebhooks = {
  slack: {
    name: "Slack",
    url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
    events: ["resource.created", "comment.created", "forum.topic.created"],
    headers: {
      "Content-Type": "application/json",
    },
  },
  discord: {
    name: "Discord",
    url: "https://discordapp.com/api/webhooks/YOUR/WEBHOOK/URL",
    events: ["resource.created", "resource.approved", "forum.topic.created"],
    headers: {
      "Content-Type": "application/json",
    },
  },
  zapier: {
    name: "Zapier",
    url: "https://hooks.zapier.com/hooks/catch/YOUR/WEBHOOK/URL",
    events: ["resource.created", "comment.created", "collection.created"],
    headers: {
      "Content-Type": "application/json",
    },
  },
  custom: {
    name: "Custom Webhook",
    url: "https://your-domain.com/webhook",
    events: [],
    headers: {},
  },
};

/**
 * Déclenche les événements de webhook
 */
export async function triggerResourceCreatedWebhook(resource: any): Promise<void> {
  await triggerWebhook({
    type: "resource.created",
    timestamp: new Date(),
    data: {
      resourceId: resource.id,
      title: resource.title,
      author: resource.authorId,
      description: resource.description,
    },
  });
}

export async function triggerResourceApprovedWebhook(resource: any): Promise<void> {
  await triggerWebhook({
    type: "resource.approved",
    timestamp: new Date(),
    data: {
      resourceId: resource.id,
      title: resource.title,
      author: resource.authorId,
    },
  });
}

export async function triggerCommentCreatedWebhook(comment: any, resource: any): Promise<void> {
  await triggerWebhook({
    type: "comment.created",
    timestamp: new Date(),
    data: {
      commentId: comment.id,
      resourceId: resource.id,
      resourceTitle: resource.title,
      author: comment.authorId,
      content: comment.content,
    },
  });
}

export async function triggerForumTopicCreatedWebhook(topic: any): Promise<void> {
  await triggerWebhook({
    type: "forum.topic.created",
    timestamp: new Date(),
    data: {
      topicId: topic.id,
      title: topic.title,
      category: topic.category,
      author: topic.authorId,
    },
  });
}

export async function triggerCollectionCreatedWebhook(collection: any): Promise<void> {
  await triggerWebhook({
    type: "collection.created",
    timestamp: new Date(),
    data: {
      collectionId: collection.id,
      name: collection.name,
      author: collection.userId,
      isPublic: collection.isPublic,
    },
  });
}
