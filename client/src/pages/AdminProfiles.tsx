import { useState, useEffect, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Plus, Trash2, Search } from 'lucide-react';

const PROFILES = ['animateur', 'formateur', 'directeur', 'stagiaire_bafa'] as const;
type ProfileType = typeof PROFILES[number];

const PROFILE_LABELS: Record<ProfileType, string> = {
  animateur: '🎯 Animateur',
  formateur: '👨‍🏫 Formateur',
  directeur: '👔 Directeur',
  stagiaire_bafa: '🎓 Stagiaire BAFA',
};

export default function AdminProfiles() {
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>('animateur');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedResources, setSelectedResources] = useState<Set<number>>(new Set());

  // Récupérer toutes les ressources
  const { data: allResources = [] } = trpc.resources.list.useQuery();

  // Récupérer les ressources du profil sélectionné
  const { data: profileResources = [], isLoading: loadingProfileResources, refetch: refetchProfileResources } = 
    trpc.resourceProfiles.getByProfile.useQuery({ profileType: selectedProfile });

  // Récupérer les collections du profil sélectionné
  const { data: profileCollections = [], isLoading: loadingProfileCollections, refetch: refetchProfileCollections } = 
    trpc.collectionProfiles.getByProfile.useQuery({ profileType: selectedProfile });

  // Récupérer toutes les collections
  const { data: allCollections = [] } = trpc.collections.list.useQuery();

  // Mutations
  const addResourceMutation = trpc.resourceProfiles.associate.useMutation({
    onSuccess: () => {
      setSelectedResources(new Set());
      refetchProfileResources();
    },
    onError: (error) => {
      console.error('Erreur lors de l\'ajout de la ressource:', error);
    },
  });

  const removeResourceMutation = trpc.resourceProfiles.remove.useMutation({
    onSuccess: () => {
      refetchProfileResources();
    },
  });

  const addCollectionMutation = trpc.collectionProfiles.associate.useMutation({
    onSuccess: () => {
      refetchProfileCollections();
    },
  });
  const removeCollectionMutation = trpc.collectionProfiles.remove.useMutation({
    onSuccess: () => {
      refetchProfileCollections();
    },
  });

  // Filtrer les ressources
  const filteredResources = allResources.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mémoriser profileResourceIds pour éviter la boucle infinie
  const profileResourceIds = useMemo(() => {
    return new Set(
      profileResources.map((pr: any) => 
        'resources' in pr ? pr.resources.id : pr.id
      )
    );
  }, [profileResources]);

  // Ressources disponibles à ajouter
  const availableResources = useMemo(() => 
    filteredResources.filter(r => !profileResourceIds.has(r.id)),
    [filteredResources, profileResourceIds]
  );

  // Réinitialiser les ressources sélectionnées quand on change de profil
  useEffect(() => {
    setSelectedResources(new Set());
  }, [selectedProfile]);

  const handleAddResources = async () => {
    for (const resourceId of Array.from(selectedResources)) {
      await addResourceMutation.mutateAsync({
        resourceId,
        profileType: selectedProfile,
      });
    }
  };

  const handleRemoveResource = async (resourceId: number) => {
    await removeResourceMutation.mutateAsync({
      resourceId,
      profileType: selectedProfile,
    });
  };

  const handleAddCollection = async (collectionId: number) => {
    await addCollectionMutation.mutateAsync({
      collectionId,
      profileType: selectedProfile,
    });
  };

  const handleRemoveCollection = async (collectionId: number) => {
    await removeCollectionMutation.mutateAsync({
      collectionId,
      profileType: selectedProfile,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Profils</h1>
        <p className="text-muted-foreground mt-2">
          Gérez les ressources et collections associées à chaque profil
        </p>
      </div>

      <Tabs value={selectedProfile} onValueChange={(v) => setSelectedProfile(v as ProfileType)}>
        <TabsList className="grid w-full grid-cols-4">
          {PROFILES.map(profile => (
            <TabsTrigger key={profile} value={profile}>
              {PROFILE_LABELS[profile]}
            </TabsTrigger>
          ))}
        </TabsList>

        {PROFILES.map(profile => (
          <TabsContent key={profile} value={profile} className="space-y-6">
            {/* Section Ressources */}
            <Card>
              <CardHeader>
                <CardTitle>Ressources du profil {PROFILE_LABELS[profile]}</CardTitle>
                <CardDescription>
                  {profileResourceIds.size} ressource{profileResourceIds.size !== 1 ? 's' : ''} associée{profileResourceIds.size !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Ressources actuelles */}
                {loadingProfileResources ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : profileResourceIds.size === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Aucune ressource associée à ce profil
                  </p>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Ressources actuelles :</h4>
                    <div className="grid gap-2">
                      {profileResources.map((pr: any) => {
                        const resource = 'resources' in pr ? pr.resources : pr;
                        return (
                          <div
                            key={resource.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {(resource.summary)?.substring(0, 100)}...
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveResource(resource.id)}
                              disabled={removeResourceMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ajouter des ressources */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Ajouter des ressources :</h4>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Chercher une ressource..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {availableResources.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Toutes les ressources sont déjà associées à ce profil
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableResources.map(resource => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedResources.has(resource.id)}
                              onChange={(e) => {
                                const newSelected = new Set(selectedResources);
                                if (e.target.checked) {
                                  newSelected.add(resource.id);
                                } else {
                                  newSelected.delete(resource.id);
                                }
                                setSelectedResources(newSelected);
                              }}
                              className="h-4 w-4"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{resource.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {(resource.summary || resource.description)?.substring(0, 80)}...
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedResources.size > 0 && (
                    <Button
                      onClick={handleAddResources}
                      disabled={addResourceMutation.isPending}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter {selectedResources.size} ressource{selectedResources.size !== 1 ? 's' : ''}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Section Collections */}
            <Card>
              <CardHeader>
                <CardTitle>Collections du profil {PROFILE_LABELS[profile]}</CardTitle>
                <CardDescription>
                  {profileCollections.length} collection{profileCollections.length !== 1 ? 's' : ''} associée{profileCollections.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Collections actuelles */}
                {loadingProfileCollections ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : profileCollections.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-8 text-center">
                    Aucune collection associée à ce profil
                  </p>
                ) : (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm">Collections actuelles :</h4>
                    <div className="grid gap-2">
                      {profileCollections.map(pc => {
                        const collection = 'collections' in pc ? pc.collections : pc;
                        return (
                          <div
                            key={collection.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="font-medium text-sm">{collection.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {collection.description?.substring(0, 100)}...
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveCollection(collection.id)}
                              disabled={removeCollectionMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Ajouter des collections */}
                <div className="border-t pt-4 space-y-3">
                  <h4 className="font-semibold text-sm">Ajouter des collections :</h4>
                  
                  {allCollections.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Aucune collection disponible
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {allCollections
                        .filter(c => !profileCollections.some(pc => {
                          const collection = 'collections' in pc ? pc.collections : pc;
                          return collection.id === c.id;
                        }))
                        .map(collection => (
                          <div
                            key={collection.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-sm">{collection.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {collection.description?.substring(0, 80)}...
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddCollection(collection.id)}
                              disabled={addCollectionMutation.isPending}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
