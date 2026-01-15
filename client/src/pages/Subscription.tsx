import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Subscription() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier si l'utilisateur a une adhésion active
  const { data: hasSubscription, isLoading: isCheckingSubscription } =
    trpc.stripe.hasActiveSubscription.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  // Créer une session de checkout
  const createCheckout = trpc.stripe.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank');
      }
    },
    onError: (error) => {
      console.error('Error creating checkout:', error);
    },
  });

  const handleSubscribe = async () => {
    setIsLoading(true);
    const origin = window.location.origin;

    createCheckout.mutate({
      successUrl: `${origin}/subscription?success=true`,
      cancelUrl: `${origin}/subscription?canceled=true`,
    });

    setIsLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Adhésion requise</CardTitle>
            <CardDescription>Veuillez vous connecter pour gérer votre adhésion</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Adhésion à la Ressourcerie IFAC</h1>
          <p className="text-lg text-muted-foreground">
            Accédez à toutes les ressources premium pour 10€ par an
          </p>
        </div>

        {/* Statut actuel */}
        {isCheckingSubscription ? (
          <Card className="mb-8">
            <CardContent className="pt-6 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Vérification de votre adhésion...</span>
            </CardContent>
          </Card>
        ) : hasSubscription ? (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle className="text-green-900">Adhésion active</CardTitle>
              </div>
              <CardDescription className="text-green-800">
                Vous avez accès à toutes les ressources premium
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscription && (
                <div className="space-y-2">
                  <p className="text-sm">
                    <strong>Valide jusqu'au :</strong>{' '}
                    {new Date((subscription as any).currentPeriodEnd).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="text-sm">
                    <strong>Statut :</strong>{' '}
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {(subscription as any).status}
                    </Badge>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8 border-amber-200 bg-amber-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <CardTitle className="text-amber-900">Pas d'adhésion active</CardTitle>
              </div>
              <CardDescription className="text-amber-800">
                Vous accédez actuellement à 70% des ressources. Adhérez pour accéder à tout.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Plan d'adhésion */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Plan Premium</CardTitle>
            <CardDescription>Accès illimité à toutes les ressources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">10€</span>
                <span className="text-muted-foreground">/an</span>
              </div>

              <ul className="space-y-3">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Accès à 100% des ressources</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Mises à jour régulières</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Support prioritaire</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Renouvellement automatique</span>
                </li>
              </ul>

              {!hasSubscription && (
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading || createCheckout.isPending}
                  className="w-full h-12 text-lg"
                  size="lg"
                >
                  {isLoading || createCheckout.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redirection vers le paiement...
                    </>
                  ) : (
                    'S\'abonner maintenant'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informations supplémentaires */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Questions ?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• Les paiements sont sécurisés via Stripe</p>
            <p>• Vous pouvez annuler votre adhésion à tout moment</p>
            <p>• Aucun frais caché</p>
            <p>• Renouvellement automatique chaque année</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
