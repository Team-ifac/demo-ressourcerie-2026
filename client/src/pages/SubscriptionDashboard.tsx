import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function SubscriptionDashboard() {
  const { user } = useAuth();
  const { data: hasSubscription, isLoading } = (trpc as any).subscription?.hasActiveSubscription?.useQuery?.() || { data: false, isLoading: false };
  const createCheckoutMutation = (trpc as any).subscription?.createCheckout?.useMutation?.() || { mutate: () => {} };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Veuillez vous connecter pour voir votre adhésion.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Gestion de votre adhésion</h1>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Statut de votre adhésion</CardTitle>
                <CardDescription>Informations sur votre abonnement actuel</CardDescription>
              </div>
              <Badge
                variant={hasSubscription ? 'default' : 'secondary'}
                className="text-lg px-3 py-1"
              >
                {hasSubscription ? '✅ Actif' : '🔄 Pas d\'adhésion'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {hasSubscription ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Vous avez une adhésion active à la Ressourcerie IFAC.
                </p>
                <p className="text-sm text-muted-foreground">
                  Vous avez accès à toutes les ressources pédagogiques premium.
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Vous n'avez pas encore d'adhésion active.</p>
                <Button
                  onClick={() => {
                    const successUrl = `${window.location.origin}/gestion-adhesion?success=true`;
                    const cancelUrl = `${window.location.origin}/gestion-adhesion?canceled=true`;
                    createCheckoutMutation.mutate({
                      successUrl,
                      cancelUrl,
                    });
                  }}
                  disabled={createCheckoutMutation.isPending}
                >
                  {createCheckoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'S\'abonner maintenant'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Features Card */}
        <Card>
          <CardHeader>
            <CardTitle>Avantages de votre adhésion</CardTitle>
            <CardDescription>Ce que vous pouvez accéder avec votre adhésion</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Toutes les ressources pédagogiques premium</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Les fiches d'activités complètes</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Les kits clé en main</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Les articles et guides approfondis</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✅</span>
                <span>Les collections thématiques</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
