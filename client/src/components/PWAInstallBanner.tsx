import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";

export default function PWAInstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { canInstall, installApp, updateAvailable, updateApp, isOnline } = usePWA();

  useEffect(() => {
    // Afficher le banner d'installation si possible
    if (canInstall && !localStorage.getItem("pwa-install-dismissed")) {
      setShowBanner(true);
    }
  }, [canInstall]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  const handleInstall = async () => {
    await installApp();
    handleDismiss();
  };

  const handleUpdate = () => {
    updateApp();
  };

  // Ne pas afficher si offline
  if (!isOnline) {
    return null;
  }

  // Afficher le banner de mise à jour
  if (updateAvailable) {
    return (
      <div className="fixed bottom-4 right-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-up z-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Mise à jour disponible</h3>
            <p className="text-sm text-blue-700 mt-1">
              Une nouvelle version de l'application est disponible.
            </p>
          </div>
          <button
            onClick={() => setShowBanner(false)}
            className="text-blue-400 hover:text-blue-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleUpdate} className="gap-2">
            <Download className="h-4 w-4" />
            Mettre à jour
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowBanner(false)}
          >
            Plus tard
          </Button>
        </div>
      </div>
    );
  }

  // Afficher le banner d'installation
  if (showBanner && canInstall) {
    return (
      <div className="fixed bottom-4 right-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg shadow-lg p-4 max-w-sm animate-slide-in-up z-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900">Installer l'application</h3>
            <p className="text-sm text-blue-700 mt-1">
              Installez la Ressourcerie IFAC sur votre appareil pour un accès rapide et hors ligne.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-blue-400 hover:text-blue-600 flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <Button size="sm" onClick={handleInstall} className="gap-2">
            <Download className="h-4 w-4" />
            Installer
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismiss}
          >
            Plus tard
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
