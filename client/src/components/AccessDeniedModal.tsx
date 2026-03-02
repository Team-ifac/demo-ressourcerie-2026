import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Lock, LogIn, Star } from 'lucide-react';
import { useLocation } from 'wouter';

interface AccessDeniedModalProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
  accessLevel: 'INTERNAL_IFAC' | 'PREMIUM';
  isAuthenticated: boolean;
}

export function AccessDeniedModal({
  isOpen,
  onClose,
  resourceTitle,
  accessLevel,
  isAuthenticated,
}: AccessDeniedModalProps) {
  const [, setLocation] = useLocation();

  const isInternalRequired = accessLevel === 'INTERNAL_IFAC';
  const isPremiumRequired = accessLevel === 'PREMIUM';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isPremiumRequired ? (
              <Star className="w-5 h-5 text-amber-600" />
            ) : (
              <LogIn className="w-5 h-5 text-blue-600" />
            )}
            <DialogTitle>Accès limité</DialogTitle>
          </div>
          <DialogDescription className="text-base mt-2">
            La ressource « <strong>{resourceTitle}</strong> » n'est pas accessible avec votre compte
            actuel.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isPremiumRequired && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="font-semibold text-amber-900 mb-2">📌 Ressource Premium</p>
              <p className="text-sm text-amber-800">
                Cette ressource est réservée aux utilisateurs avec une adhésion active. Adhérez pour
                accéder à toutes les ressources premium.
              </p>
            </div>
          )}

          {isInternalRequired && !isAuthenticated && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="font-semibold text-blue-900 mb-2">🔐 Connexion requise (ifac)</p>
              <p className="text-sm text-blue-800">
                Connectez-vous pour accéder à cette ressource.
              </p>
            </div>
          )}

          {isInternalRequired && isAuthenticated && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">✅ Connexion détectée</p>
              <p className="text-sm text-green-800">
                Vous êtes connecté·e. Veuillez rafraîchir la page ou réessayer.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>

          {isPremiumRequired && (
            <Button
              onClick={() => {
                onClose();
                setLocation('/adhesion');
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Star className="w-4 h-4 mr-2" />
              S'abonner (10€/an)
            </Button>
          )}

          {isInternalRequired && !isAuthenticated && (
            <Button
              onClick={() => {
                onClose();
                setLocation('/auth/login');
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Se connecter
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
