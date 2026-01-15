import { useEffect, useRef, useState, useCallback } from "react";

export interface Notification {
  id: string;
  type: "comment" | "forum" | "resource" | "collection" | "badge" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
  icon?: string;
}

/**
 * Hook pour gérer les notifications en temps réel
 * Utilise le polling pour récupérer les notifications du serveur
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(true);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Récupérer les notifications du serveur via polling
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        // Simulation de récupération de notifications
        // En production, cela ferait un appel tRPC
        setIsConnected(true);
      } catch (error) {
        console.error("Erreur lors de la récupération des notifications:", error);
        setIsConnected(false);
      }
    };

    // Récupérer les notifications immédiatement
    fetchNotifications();

    // Configurer le polling toutes les 30 secondes
    pollingRef.current = setInterval(fetchNotifications, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Marquer une notification comme lue
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Marquer toutes les notifications comme lues
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
    setUnreadCount(0);
  }, []);

  // Supprimer une notification
  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId)
    );
  }, []);

  // Supprimer toutes les notifications
  const deleteAllNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  // Demander la permission pour les notifications du navigateur
  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        return true;
      }
      if (Notification.permission !== "denied") {
        const permission = await Notification.requestPermission();
        return permission === "granted";
      }
    }
    return false;
  }, []);

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    requestNotificationPermission,
  };
}
