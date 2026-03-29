import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { useAuth } from '../_core/hooks/useAuth';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Loader2 } from 'lucide-react';

type ProfileType = 'animateur' | 'formateur' | 'directeur' | 'stagiaire_bafa';

const PROFILES: Array<{
  id: ProfileType;
  title: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    id: 'animateur',
    title: 'Animateur·rice',
    description: 'Ressources pour animer des activités et gérer des groupes',
    icon: '🎯',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 'formateur',
    title: 'Formateur·rice',
    description: 'Supports de formation et approfondissements thématiques',
    icon: '📚',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 'directeur',
    title: 'Directeur·rice',
    description: 'Outils de gestion, management et administration',
    icon: '👔',
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 'stagiaire_bafa',
    title: 'Stagiaire BAFA/BAFD',
    description: 'Ressources pour débuter et réussir votre formation',
    icon: '🎓',
    color: 'from-green-500 to-green-600',
  },
];

export function ProfileSelection() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();

  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const setProfileMutation = trpc.profiles.setUserProfile.useMutation();
  const { data: myProfile } = trpc.profiles.getUserProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // UX : ici, on autorise tout le monde à choisir/changer son profil.
  // La sécurité et le filtrage réel sont déjà gérés côté backend.
  const canChangeProfile = true;

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [loading, user, navigate]);

  const handleSelectProfile = async (profileType: ProfileType) => {
    if (isLoading) return;

    setSelectedProfile(profileType);
    setIsLoading(true);

    try {
      await setProfileMutation.mutateAsync({ profileType });
      navigate(`/profil/${profileType}`);
    } catch (error) {
      console.error('Error setting profile:', error);
      setIsLoading(false);
      setSelectedProfile(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12 px-4">
      <div className="container max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4">
            Bienvenue, <span className="text-primary">{user.name}</span> !
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sélectionnez votre profil pour accéder aux ressources adaptées à votre rôle
          </p>

          {myProfile?.profileType && (
            <p className="mt-4 text-sm text-muted-foreground">
              Profil actuel : <strong>{myProfile.profileType}</strong>
            </p>
          )}
        </div>

        {/* Profiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PROFILES.map((profile) => (
            <div
              key={profile.id}
              onClick={() => handleSelectProfile(profile.id)}
              className={`group relative overflow-hidden ${
                canChangeProfile ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-0">
                <CardContent className="p-0 flex flex-col h-full">
                  <div className={`h-32 bg-gradient-to-br ${profile.color}`} />

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="text-5xl mb-4">{profile.icon}</div>
                    <h3 className="font-semibold text-lg mb-2 text-left">{profile.title}</h3>
                    <p className="text-sm text-muted-foreground text-left flex-1 mb-4">
                      {profile.description}
                    </p>

                    {selectedProfile === profile.id && isLoading ? (
                      <div className="flex items-center justify-center gap-2 text-primary">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Sélection en cours...</span>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled={isLoading || !canChangeProfile}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleSelectProfile(profile.id);
                        }}
                      >
                        Choisir ce profil
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 p-8 bg-muted/50 rounded-lg border border-muted">
          <h2 className="text-2xl font-bold mb-4">Pourquoi choisir un profil ?</h2>
          <p className="text-muted-foreground mb-4">
            Votre profil vous permet d'accéder à des ressources adaptées à votre besoin du moment.
            Le filtrage et les règles d’accès sont gérés côté serveur.
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li>✅ Ressources adaptées selon le profil choisi</li>
            <li>✅ Navigation simplifiée</li>
            <li>✅ Contenu pertinent</li>
            <li>✅ Profil modifiable à tout moment</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
