// Service Worker pour la Ressourcerie IFAC
// Gère le caching, la synchronisation en arrière-plan et les notifications

const CACHE_VERSION = "v1";
const CACHE_NAMES = {
  static: `ressourcerie-static-${CACHE_VERSION}`,
  dynamic: `ressourcerie-dynamic-${CACHE_VERSION}`,
  images: `ressourcerie-images-${CACHE_VERSION}`,
  api: `ressourcerie-api-${CACHE_VERSION}`,
};

// Fichiers statiques à mettre en cache au démarrage
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/animations.css",
];

// Installation du Service Worker
self.addEventListener("install", (event) => {
  console.log("[SW] Installation du Service Worker");

  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      console.log("[SW] Mise en cache des fichiers statiques");
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener("activate", (event) => {
  console.log("[SW] Activation du Service Worker");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Supprimer les anciens caches
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            console.log("[SW] Suppression du cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  self.clients.claim();
});

// Interception des requêtes
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes non-GET
  if (request.method !== "GET") {
    return;
  }

  // Ignorer les requêtes chrome-extension
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Stratégie pour les API
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Stratégie pour les images
  if (request.destination === "image") {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }

  // Stratégie par défaut pour les autres ressources
  event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.dynamic));
});

// Cache First Strategy (cherche d'abord en cache)
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      console.log("[SW] Cache hit:", request.url);
      return cached;
    }

    const response = await fetch(request);

    // Mettre en cache les réponses réussies
    if (response.ok) {
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
    }

    return response;
  } catch (error) {
    console.error("[SW] Erreur Cache First:", error);

    // Retourner une réponse offline
    return caches.match("/") || new Response("Offline", { status: 503 });
  }
}

// Network First Strategy (cherche d'abord en réseau)
async function networkFirstStrategy(request) {
  try {
    const response = await fetch(request);

    // Mettre en cache les réponses réussies
    if (response.ok) {
      const cache = await caches.open(CACHE_NAMES.api);
      const clonedResponse = response.clone();
      cache.put(request, clonedResponse);
    }

    return response;
  } catch (error) {
    console.error("[SW] Erreur Network First:", error);

    // Retourner la version en cache si disponible
    const cache = await caches.open(CACHE_NAMES.api);
    const cached = await cache.match(request);

    if (cached) {
      console.log("[SW] Cache fallback:", request.url);
      return cached;
    }

    return new Response("Offline", { status: 503 });
  }
}

// Synchronisation en arrière-plan
self.addEventListener("sync", (event) => {
  console.log("[SW] Synchronisation en arrière-plan:", event.tag);

  if (event.tag === "sync-resources") {
    event.waitUntil(syncResources());
  } else if (event.tag === "sync-comments") {
    event.waitUntil(syncComments());
  }
});

async function syncResources() {
  try {
    console.log("[SW] Synchronisation des ressources");
    // Implémentation future : synchroniser les ressources depuis le serveur
  } catch (error) {
    console.error("[SW] Erreur lors de la synchronisation:", error);
  }
}

async function syncComments() {
  try {
    console.log("[SW] Synchronisation des commentaires");
    // Implémentation future : synchroniser les commentaires depuis le serveur
  } catch (error) {
    console.error("[SW] Erreur lors de la synchronisation:", error);
  }
}

// Notifications push
self.addEventListener("push", (event) => {
  console.log("[SW] Notification push reçue");

  const data = event.data?.json() || {};
  const options = {
    body: data.body || "Nouvelle notification",
    icon: "/icon-192x192.png",
    badge: "/icon-192x192.png",
    tag: data.tag || "notification",
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: "open",
        title: "Ouvrir",
      },
      {
        action: "close",
        title: "Fermer",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Ressourcerie IFAC", options));
});

// Clic sur les notifications
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Clic sur notification:", event.action);

  event.notification.close();

  if (event.action === "open" || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        // Chercher une fenêtre existante
        for (const client of clientList) {
          if (client.url === "/" && "focus" in client) {
            return client.focus();
          }
        }

        // Ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow("/");
        }
      })
    );
  }
});

// Message depuis le client
self.addEventListener("message", (event) => {
  console.log("[SW] Message reçu:", event.data);

  if (event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      })
    );
  }

  if (event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// Heartbeat pour vérifier la connexion
setInterval(() => {
  console.log("[SW] Service Worker actif");
}, 60000);
