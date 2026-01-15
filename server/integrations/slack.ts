/**
 * Slack Integration Service
 * Envoie les notifications importantes vers Slack
 */

import axios from "axios";

interface SlackMessage {
  channel?: string;
  text?: string;
  blocks?: any[];
  attachments?: any[];
  thread_ts?: string;
  username?: string;
  icon_emoji?: string;
  [key: string]: any;
}

interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

class SlackIntegration {
  private config: SlackConfig | null = null;
  private isConfigured = false;

  /**
   * Configure l'intégration Slack
   */
  configure(config: SlackConfig) {
    this.config = config;
    this.isConfigured = !!config.webhookUrl;
    console.log("[Slack] Intégration configurée");
  }

  /**
   * Envoie un message simple à Slack
   */
  async sendMessage(text: string, channel?: string): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.warn("[Slack] Intégration non configurée");
      return false;
    }

    try {
      const payload: SlackMessage = {
        text,
        channel: channel || this.config.channel,
        username: this.config.username || "Ressourcerie IFAC",
        icon_emoji: this.config.iconEmoji || ":books:",
      };

      await axios.post(this.config.webhookUrl, payload);
      console.log("[Slack] Message envoyé avec succès");
      return true;
    } catch (error) {
      console.error("[Slack] Erreur lors de l'envoi du message:", error);
      return false;
    }
  }

  /**
   * Envoie une notification de nouvelle ressource
   */
  async notifyNewResource(resourceTitle: string, author: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📚 Nouvelle ressource soumise",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Titre:*\n${resourceTitle}`,
          },
          {
            type: "mrkdwn",
            text: `*Auteur:*\n${author}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Voir la ressource",
            },
            url,
            style: "primary",
          },
        ],
      },
    ];

    return this.sendBlockMessage(blocks);
  }

  /**
   * Envoie une notification de nouveau commentaire
   */
  async notifyNewComment(resourceTitle: string, author: string, comment: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "💬 Nouveau commentaire",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Ressource:* ${resourceTitle}\n*Auteur:* ${author}\n*Commentaire:* ${comment}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Voir le commentaire",
            },
            url,
            style: "primary",
          },
        ],
      },
    ];

    return this.sendBlockMessage(blocks);
  }

  /**
   * Envoie une notification de nouveau sujet au forum
   */
  async notifyNewForumTopic(title: string, author: string, category: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🗣️ Nouveau sujet au forum",
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Titre:*\n${title}`,
          },
          {
            type: "mrkdwn",
            text: `*Catégorie:*\n${category}`,
          },
          {
            type: "mrkdwn",
            text: `*Auteur:*\n${author}`,
          },
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Voir le sujet",
            },
            url,
            style: "primary",
          },
        ],
      },
    ];

    return this.sendBlockMessage(blocks);
  }

  /**
   * Envoie une notification d'erreur critique
   */
  async notifyError(error: string, context?: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured) return false;

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "🚨 Erreur critique",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `\`\`\`${error}\`\`\``,
        },
      },
    ];

    if (context) {
      blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Contexte:*\n${JSON.stringify(context, null, 2)}`,
        },
      });
    }

    return this.sendBlockMessage(blocks);
  }

  /**
   * Envoie une notification de statistiques
   */
  async notifyStats(stats: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured) return false;

    const fields = Object.entries(stats).map(([key, value]) => ({
      type: "mrkdwn",
      text: `*${key}:*\n${value}`,
    }));

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📊 Statistiques",
        },
      },
      {
        type: "section",
        fields,
      },
    ];

    return this.sendBlockMessage(blocks);
  }

  /**
   * Envoie un message avec blocks
   */
  private async sendBlockMessage(blocks: any[]): Promise<boolean> {
    if (!this.isConfigured || !this.config) return false;

    try {
      const payload: SlackMessage = {
        blocks,
        username: this.config.username || "Ressourcerie IFAC",
        icon_emoji: this.config.iconEmoji || ":books:",
      };

      await axios.post(this.config.webhookUrl, payload);
      console.log("[Slack] Message avec blocks envoyé avec succès");
      return true;
    } catch (error) {
      console.error("[Slack] Erreur lors de l'envoi du message:", error);
      return false;
    }
  }

  /**
   * Teste la connexion à Slack
   */
  async testConnection(): Promise<boolean> {
    return this.sendMessage("🧪 Test de connexion à Slack - Ressourcerie IFAC");
  }

  /**
   * Vérifie si l'intégration est configurée
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const slackIntegration = new SlackIntegration();
export default slackIntegration;
