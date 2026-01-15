import { useEffect, useState } from "react";

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  updateAvailable: boolean;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    isServiceWorkerReady: false,
    updateAvailable: false,
  });

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Enregistrer le Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("[PWA] Service Worker enregistré:", registration);

          setState((prev) => ({
            ...prev,
            isServiceWorkerReady: true,
          }));

          // Écouter les mises à jour
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;

            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "activated") {
                  console.log("[PWA] Nouvelle version disponible");
                  setState((prev) => ({
                    ...prev,
                    updateAvailable: true,
                  }));
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error("[PWA] Erreur lors de l'enregistrement du Service Worker:", error);
        });
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      setState((prev) => ({
        ...prev,
        isInstalled: false,
      }));
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      console.log("[PWA] Application installée");
      setDeferredPrompt(null);

      setState((prev) => ({
        ...prev,
        isInstalled: true,
      }));
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // Écouter les changements de connectivité
    const handleOnline = () => {
      console.log("[PWA] Connexion rétablie");
      setState((prev) => ({
        ...prev,
        isOnline: true,
      }));
    };

    const handleOffline = () => {
      console.log("[PWA] Connexion perdue");
      setState((prev) => ({
        ...prev,
        isOnline: false,
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) {
      console.log("[PWA] Installation non disponible");
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`[PWA] Utilisateur a choisi: ${outcome}`);

    setDeferredPrompt(null);
  };

  const updateApp = () => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.update();
        });
      });

      // Recharger la page après une courte attente
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  };

  const clearCache = async () => {
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();

      registrations.forEach((registration) => {
        registration.active?.postMessage({
          type: "CLEAR_CACHE",
        });
      });

      // Vider le cache manuellement aussi
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      console.log("[PWA] Cache vidé");
    }
  };

  const syncInBackground = async (tag: string) => {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register(tag);
        console.log(`[PWA] Synchronisation ${tag} enregistrée`);
      } catch (error) {
        console.error(`[PWA] Erreur lors de la synchronisation ${tag}:`, error);
      }
    }
  };

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("[PWA] Les notifications ne sont pas supportées");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }

    return false;
  };

  const sendNotification = async (title: string, options?: NotificationOptions) => {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        ...options,
      });
    }
  };

  return {
    ...state,
    installApp,
    updateApp,
    clearCache,
    syncInBackground,
    requestNotificationPermission,
    sendNotification,
    canInstall: !!deferredPrompt,
  };
}
