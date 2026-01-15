/**
 * Monitoring Service - Suivi des erreurs et des performances
 * Compatible avec Sentry, LogRocket ou autre service de monitoring
 */

interface ErrorContext {
  userId?: string;
  page?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

class MonitoringService {
  private isInitialized = false;
  private errors: Array<{ message: string; context: ErrorContext; timestamp: number }> = [];
  private metrics: PerformanceMetric[] = [];

  /**
   * Initialise le service de monitoring
   */
  init(config?: { dsn?: string; environment?: string; debug?: boolean }) {
    if (this.isInitialized) return;

    console.log("[Monitoring] Initialisation du service de monitoring");

    // Capturer les erreurs non gérées
    window.addEventListener("error", (event) => {
      this.captureError(event.error, {
        component: "window.onerror",
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Capturer les promesses rejetées non gérées
    window.addEventListener("unhandledrejection", (event) => {
      this.captureError(event.reason, {
        component: "unhandledrejection",
      });
    });

    // Mesurer les performances
    this.measurePerformance();

    // Envoyer les erreurs périodiquement
    setInterval(() => {
      this.flushErrors();
    }, 30000);

    this.isInitialized = true;
  }

  /**
   * Capture une erreur
   */
  captureError(error: any, context?: ErrorContext) {
    const errorMessage = error?.message || String(error);

    console.error("[Monitoring] Erreur capturée:", errorMessage, context);

    this.errors.push({
      message: errorMessage,
      context: context || {},
      timestamp: Date.now(),
    });

    // Garder seulement les 50 dernières erreurs
    if (this.errors.length > 50) {
      this.errors.shift();
    }

    // Envoyer immédiatement si c'est une erreur critique
    if (error?.critical) {
      this.flushErrors();
    }
  }

  /**
   * Capture une exception
   */
  captureException(exception: Error, context?: ErrorContext) {
    this.captureError(exception, {
      ...context,
      component: context?.component || "exception",
    });
  }

  /**
   * Enregistre un message
   */
  captureMessage(message: string, level: "info" | "warning" | "error" = "info", context?: ErrorContext) {
    console.log(`[Monitoring] ${level.toUpperCase()}: ${message}`, context);

    if (level === "error") {
      this.errors.push({
        message,
        context: context || {},
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Enregistre une métrique de performance
   */
  recordMetric(name: string, value: number, unit: string = "ms") {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);

    console.log(`[Monitoring] Métrique: ${name} = ${value}${unit}`);

    // Garder seulement les 100 dernières métriques
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }
  }

  /**
   * Mesure les performances de la page
   */
  private measurePerformance() {
    if (!window.performance) return;

    // Attendre que la page soit chargée
    window.addEventListener("load", () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        this.recordMetric("page_load_time", pageLoadTime);

        // Autres métriques
        const connectTime = perfData.responseEnd - perfData.requestStart;
        this.recordMetric("connect_time", connectTime);

        const renderTime = perfData.domComplete - perfData.domLoading;
        this.recordMetric("render_time", renderTime);

        console.log("[Monitoring] Performances:", {
          pageLoadTime,
          connectTime,
          renderTime,
        });
      }, 0);
    });

    // Utiliser PerformanceObserver si disponible
    if ("PerformanceObserver" in window) {
      try {
        // Observer les Core Web Vitals
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "largest-contentful-paint") {
              this.recordMetric("lcp", (entry as any).renderTime || (entry as any).loadTime);
            } else if (entry.entryType === "first-input") {
              this.recordMetric("fid", (entry as any).processingDuration);
            } else if (entry.entryType === "layout-shift") {
              this.recordMetric("cls", (entry as any).value);
            }
          }
        });

        observer.observe({
          entryTypes: ["largest-contentful-paint", "first-input", "layout-shift"],
        });
      } catch (e) {
        console.warn("[Monitoring] PerformanceObserver non supporté");
      }
    }
  }

  /**
   * Envoie les erreurs collectées
   */
  private flushErrors() {
    if (this.errors.length === 0) return;

    console.log(`[Monitoring] Envoi de ${this.errors.length} erreur(s)`);

    // Implémentation future : envoyer à Sentry ou autre service
    // const payload = {
    //   errors: this.errors,
    //   metrics: this.metrics,
    //   userAgent: navigator.userAgent,
    //   timestamp: Date.now(),
    // };
    // fetch('/api/monitoring', { method: 'POST', body: JSON.stringify(payload) });

    // Pour l'instant, afficher dans la console
    console.table(this.errors);

    // Vider après envoi
    this.errors = [];
  }

  /**
   * Définit le contexte utilisateur
   */
  setUserContext(userId: string, email?: string, name?: string) {
    console.log("[Monitoring] Contexte utilisateur défini:", { userId, email, name });

    // Implémentation future : envoyer à Sentry
    // Sentry.setUser({ id: userId, email, name });
  }

  /**
   * Efface le contexte utilisateur
   */
  clearUserContext() {
    console.log("[Monitoring] Contexte utilisateur effacé");

    // Implémentation future : envoyer à Sentry
    // Sentry.setUser(null);
  }

  /**
   * Ajoute du contexte supplémentaire
   */
  addContext(key: string, value: Record<string, any>) {
    console.log("[Monitoring] Contexte ajouté:", { [key]: value });

    // Implémentation future : envoyer à Sentry
    // Sentry.setContext(key, value);
  }

  /**
   * Enregistre une transaction (pour le suivi des performances)
   */
  startTransaction(name: string) {
    const startTime = performance.now();

    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(`transaction_${name}`, duration);
      },
    };
  }

  /**
   * Récupère les erreurs collectées
   */
  getErrors() {
    return [...this.errors];
  }

  /**
   * Récupère les métriques collectées
   */
  getMetrics() {
    return [...this.metrics];
  }

  /**
   * Exporte les données de monitoring
   */
  export() {
    return {
      errors: this.errors,
      metrics: this.metrics,
      timestamp: Date.now(),
    };
  }

  /**
   * Réinitialise le service
   */
  reset() {
    this.errors = [];
    this.metrics = [];
    console.log("[Monitoring] Service réinitialisé");
  }
}

// Exporter une instance singleton
export const monitoring = new MonitoringService();

// Initialiser automatiquement
if (typeof window !== "undefined") {
  monitoring.init({
    environment: import.meta.env.MODE,
    debug: import.meta.env.DEV,
  });
}

export default monitoring;
