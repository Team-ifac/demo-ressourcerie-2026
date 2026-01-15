/**
 * Google Analytics Service
 * Suivi avancé des événements et des performances
 */

interface AnalyticsEvent {
  name: string;
  params?: Record<string, any>;
}

interface AnalyticsUser {
  userId?: string;
  email?: string;
  role?: string;
}

class AnalyticsService {
  private isInitialized = false;
  private measurementId: string = "";
  private events: AnalyticsEvent[] = [];

  /**
   * Initialise Google Analytics
   */
  init(measurementId: string) {
    this.measurementId = measurementId;

    // Charger le script GA
    if (typeof window !== "undefined") {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      // Initialiser gtag
      (window as any).dataLayer = (window as any).dataLayer || [];
      const gtag = function (...args: any[]) {
        (window as any).dataLayer.push(args);
      };
      (window as any).gtag = gtag;
      gtag("js", new Date());
      gtag("config", measurementId, {
        page_path: window.location.pathname,
        anonymize_ip: true,
      });

      this.isInitialized = true;
      console.log("[Analytics] Google Analytics initialisé");
    }
  }

  /**
   * Envoie un événement personnalisé
   */
  trackEvent(eventName: string, params?: Record<string, any>) {
    if (!this.isInitialized) return;

    const event: AnalyticsEvent = {
      name: eventName,
      params,
    };

    this.events.push(event);

    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", eventName, params || {});
      console.log("[Analytics] Événement tracké:", eventName, params);
    }
  }

  /**
   * Suivi de la consultation d'une ressource
   */
  trackResourceView(resourceId: string, resourceTitle: string, category?: string) {
    this.trackEvent("view_resource", {
      resource_id: resourceId,
      resource_title: resourceTitle,
      resource_category: category,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi du téléchargement d'une ressource
   */
  trackResourceDownload(resourceId: string, resourceTitle: string, fileType?: string) {
    this.trackEvent("download_resource", {
      resource_id: resourceId,
      resource_title: resourceTitle,
      file_type: fileType,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi du partage d'une ressource
   */
  trackResourceShare(resourceId: string, resourceTitle: string, platform: string) {
    this.trackEvent("share_resource", {
      resource_id: resourceId,
      resource_title: resourceTitle,
      platform,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de l'ajout d'un commentaire
   */
  trackCommentAdded(resourceId: string, resourceTitle: string) {
    this.trackEvent("add_comment", {
      resource_id: resourceId,
      resource_title: resourceTitle,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de la soumission d'une ressource
   */
  trackResourceSubmission(resourceTitle: string, category?: string) {
    this.trackEvent("submit_resource", {
      resource_title: resourceTitle,
      resource_category: category,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de la participation au forum
   */
  trackForumParticipation(topicTitle: string, category: string) {
    this.trackEvent("forum_participation", {
      topic_title: topicTitle,
      category,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de la création d'une collection
   */
  trackCollectionCreation(collectionName: string, resourceCount: number) {
    this.trackEvent("create_collection", {
      collection_name: collectionName,
      resource_count: resourceCount,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de la recherche
   */
  trackSearch(query: string, resultCount: number, filters?: Record<string, any>) {
    this.trackEvent("search", {
      search_term: query,
      result_count: resultCount,
      filters,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de l'engagement utilisateur
   */
  trackEngagement(engagementType: string, duration: number) {
    this.trackEvent("engagement", {
      engagement_type: engagementType,
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de l'installation PWA
   */
  trackPWAInstall() {
    this.trackEvent("pwa_install", {
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de l'erreur
   */
  trackError(errorName: string, errorMessage: string, errorContext?: Record<string, any>) {
    this.trackEvent("error", {
      error_name: errorName,
      error_message: errorMessage,
      error_context: errorContext,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Définit l'ID utilisateur
   */
  setUserId(userId: string) {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("config", this.measurementId, {
        user_id: userId,
      });
      console.log("[Analytics] ID utilisateur défini:", userId);
    }
  }

  /**
   * Définit les propriétés utilisateur
   */
  setUserProperties(user: AnalyticsUser) {
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("set", {
        user_id: user.userId,
        user_email: user.email,
        user_role: user.role,
      });
      console.log("[Analytics] Propriétés utilisateur définies");
    }
  }

  /**
   * Suivi du temps de session
   */
  trackSessionDuration(duration: number) {
    this.trackEvent("session_duration", {
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Suivi de la page vue
   */
  trackPageView(pageName: string, pageTitle?: string) {
    this.trackEvent("page_view", {
      page_name: pageName,
      page_title: pageTitle,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Récupère les événements collectés
   */
  getEvents() {
    return [...this.events];
  }

  /**
   * Exporte les données d'analytics
   */
  export() {
    return {
      events: this.events,
      measurementId: this.measurementId,
      timestamp: Date.now(),
    };
  }

  /**
   * Réinitialise le service
   */
  reset() {
    this.events = [];
    console.log("[Analytics] Service réinitialisé");
  }
}

export const analytics = new AnalyticsService();

// Initialiser automatiquement si l'ID de mesure est disponible
if (typeof window !== "undefined") {
  const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (measurementId) {
    analytics.init(measurementId);
  }
}

export default analytics;
