import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, AlertCircle, Loader2, LogOut, Edit2 } from 'lucide-react';
import { useLocation } from 'wouter';

const PROFILE_LABELS: Record<string, string> = {
  animateur: '🎨 Animateur',
  formateur: '👨‍🏫 Formateur',
  directeur: '👔 Directeur',
  stagiaire_bafa: '🏕️ Stagiaire BAFA',
};

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  animateur: 'Ressources pour les animateurs et coordinateurs',
  formateur: 'Ressources pour les formateurs et éducateurs',
  directeur: 'Ressources pour les directeurs et responsables',
  stagiaire_bafa: 'Ressources pour les stagiaires BAFA',
};

export default function UserProfileManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isChangingProfile, setIsChangingProfile] = useState(false);

  // Récupérer le profil actuel
  const { data: userProfile, isLoading: isLoadingProfile } = trpc.profiles.getUserProfile.useQuery(
    undefined,
    { enabled: !!user }
  );

  // Vérifier l'adhésion
  const { data: hasSubscription, isLoading: isCheckingSubscription } =
    trpc.stripe.hasActiveSubscription.useQuery(undefined, {
      enabled: !!user,
    });

  const { data: subscription } = trpc.stripe.getSubscription.useQuery(undefined, {
    enabled: !!user,
  });

  // Mutation pour changer de profil
  const changeProfile = trpc.profiles.setUserProfile.useMutation({
    onSuccess: () => {
      setIsChangingProfile(false);
      window.location.href = '/resources';
    },
  });

  // Mutation pour se déconnecter
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Accès requis</CardTitle>
            <CardDescription>Veuillez vous connecter pour gérer votre profil</CardDescription>
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Mon profil</h1>
          <p className="text-lg text-muted-foreground">
            Gérez votre profil et vos préférences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="subscription">Adhésion</TabsTrigger>
            <TabsTrigger value="account">Compte</TabsTrigger>
          </TabsList>

          {/* Onglet Profil */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profil actuel</CardTitle>
                <CardDescription>Votre profil détermine les ressources que vous voyez</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingProfile ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Chargement du profil...</span>
                  </div>
                ) : userProfile ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-900">
                        {PROFILE_LABELS[userProfile.profileType] || userProfile.profileType}
                      </p>
                      <p className="text-sm text-blue-800 mt-1">
                        {PROFILE_DESCRIPTIONS[userProfile.profileType]}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-amber-900">Aucun profil sélectionné</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Changer de profil</CardTitle>
                <CardDescription>Sélectionnez un nouveau profil</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(PROFILE_LABELS).map(([key, label]) => (
                    <Button
                      key={key}
                      variant={userProfile?.profileType === key ? 'default' : 'outline'}
                      onClick={() => {
                        setIsChangingProfile(true);
                        changeProfile.mutate({ profileType: key as any });
                      }}
                      disabled={isChangingProfile || changeProfile.isPending}
                      className="h-auto py-4 justify-start"
                    >
                      <div className="text-left">
                        <div className="font-semibold">{label}</div>
                        <div className="text-xs text-muted-foreground">
                          {PROFILE_DESCRIPTIONS[key]}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Adhésion */}
          <TabsContent value="subscription" className="space-y-6">
            {isCheckingSubscription ? (
              <Card>
                <CardContent className="pt-6 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Vérification de votre adhésion...</span>
                </CardContent>
              </Card>
            ) : hasSubscription ? (
              <Card className="border-green-200 bg-green-50">
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
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-semibold">Valide jusqu'au :</p>
                        <p className="text-lg">
                          {new Date((subscription as any).currentPeriodEnd).toLocaleDateString(
                            'fr-FR'
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold">Statut :</p>
                        <Badge className="bg-green-100 text-green-800 mt-1">
                          {(subscription as any).status}
                        </Badge>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 bg-amber-50">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <CardTitle className="text-amber-900">Pas d'adhésion active</CardTitle>
                  </div>
                  <CardDescription className="text-amber-800">
                    Adhérez pour accéder à toutes les ressources premium
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setLocation('/adhesion')} className="w-full">
                    S'abonner maintenant (10€/an)
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Onglet Compte */}
          <TabsContent value="account" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du compte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Nom</p>
                  <p className="text-lg">{user.name || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Email</p>
                  <p className="text-lg">{user.email || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Rôle</p>
                  <Badge className="mt-1">
                    {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation('/selection-profil')}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Changer de profil
                </Button>
                <Button
                  variant="destructive"
                  className="w-full justify-start"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
