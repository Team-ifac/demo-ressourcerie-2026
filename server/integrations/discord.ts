/**
 * Discord Integration Service
 * Envoie les notifications importantes vers Discord
 */

import axios from "axios";

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    icon_url?: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
  url?: string;
}

interface DiscordMessage {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

interface DiscordConfig {
  webhookUrl: string;
  username?: string;
  avatarUrl?: string;
}

class DiscordIntegration {
  private config: DiscordConfig | null = null;
  private isConfigured = false;

  // Couleurs Discord (décimal)
  private colors = {
    primary: 3447003, // Bleu
    success: 3066993, // Vert
    warning: 16776960, // Jaune
    error: 15158332, // Rouge
    info: 3447003, // Bleu
  };

  /**
   * Configure l'intégration Discord
   */
  configure(config: DiscordConfig) {
    this.config = config;
    this.isConfigured = !!config.webhookUrl;
    console.log("[Discord] Intégration configurée");
  }

  /**
   * Envoie un message simple à Discord
   */
  async sendMessage(content: string): Promise<boolean> {
    if (!this.isConfigured || !this.config) {
      console.warn("[Discord] Intégration non configurée");
      return false;
    }

    try {
      const payload: DiscordMessage = {
        content,
        username: this.config.username || "Ressourcerie IFAC",
        avatar_url: this.config.avatarUrl,
      };

      await axios.post(this.config.webhookUrl, payload);
      console.log("[Discord] Message envoyé avec succès");
      return true;
    } catch (error) {
      console.error("[Discord] Erreur lors de l'envoi du message:", error);
      return false;
    }
  }

  /**
   * Envoie une notification de nouvelle ressource
   */
  async notifyNewResource(resourceTitle: string, author: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const embed: DiscordEmbed = {
      title: "📚 Nouvelle ressource soumise",
      color: this.colors.primary,
      fields: [
        {
          name: "Titre",
          value: resourceTitle,
          inline: false,
        },
        {
          name: "Auteur",
          value: author,
          inline: true,
        },
      ],
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
      url,
    };

    return this.sendEmbed(embed);
  }

  /**
   * Envoie une notification de nouveau commentaire
   */
  async notifyNewComment(resourceTitle: string, author: string, comment: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const embed: DiscordEmbed = {
      title: "💬 Nouveau commentaire",
      description: comment,
      color: this.colors.info,
      fields: [
        {
          name: "Ressource",
          value: resourceTitle,
          inline: true,
        },
        {
          name: "Auteur",
          value: author,
          inline: true,
        },
      ],
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
      url,
    };

    return this.sendEmbed(embed);
  }

  /**
   * Envoie une notification de nouveau sujet au forum
   */
  async notifyNewForumTopic(title: string, author: string, category: string, url: string): Promise<boolean> {
    if (!this.isConfigured) return false;

    const embed: DiscordEmbed = {
      title: "🗣️ Nouveau sujet au forum",
      description: title,
      color: this.colors.primary,
      fields: [
        {
          name: "Catégorie",
          value: category,
          inline: true,
        },
        {
          name: "Auteur",
          value: author,
          inline: true,
        },
      ],
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
      url,
    };

    return this.sendEmbed(embed);
  }

  /**
   * Envoie une notification d'erreur critique
   */
  async notifyError(error: string, context?: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured) return false;

    const embed: DiscordEmbed = {
      title: "🚨 Erreur critique",
      description: `\`\`\`${error}\`\`\``,
      color: this.colors.error,
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
    };

    if (context) {
      embed.fields = [
        {
          name: "Contexte",
          value: `\`\`\`json\n${JSON.stringify(context, null, 2)}\`\`\``,
          inline: false,
        },
      ];
    }

    return this.sendEmbed(embed);
  }

  /**
   * Envoie une notification de statistiques
   */
  async notifyStats(stats: Record<string, any>): Promise<boolean> {
    if (!this.isConfigured) return false;

    const fields: DiscordEmbed["fields"] = Object.entries(stats).map(([key, value]) => ({
      name: key,
      value: String(value),
      inline: true,
    }));

    const embed: DiscordEmbed = {
      title: "📊 Statistiques",
      color: this.colors.success,
      fields,
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendEmbed(embed);
  }

  /**
   * Envoie un embed Discord
   */
  private async sendEmbed(embed: DiscordEmbed): Promise<boolean> {
    if (!this.isConfigured || !this.config) return false;

    try {
      const payload: DiscordMessage = {
        embeds: [embed],
        username: this.config.username || "Ressourcerie IFAC",
        avatar_url: this.config.avatarUrl,
      };

      await axios.post(this.config.webhookUrl, payload);
      console.log("[Discord] Embed envoyé avec succès");
      return true;
    } catch (error) {
      console.error("[Discord] Erreur lors de l'envoi de l'embed:", error);
      return false;
    }
  }

  /**
   * Teste la connexion à Discord
   */
  async testConnection(): Promise<boolean> {
    const embed: DiscordEmbed = {
      title: "🧪 Test de connexion",
      description: "Test de connexion à Discord - Ressourcerie IFAC",
      color: this.colors.success,
      footer: {
        text: "Ressourcerie IFAC",
      },
      timestamp: new Date().toISOString(),
    };

    return this.sendEmbed(embed);
  }

  /**
   * Vérifie si l'intégration est configurée
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const discordIntegration = new DiscordIntegration();
export default discordIntegration;
