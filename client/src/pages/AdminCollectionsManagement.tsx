import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Search, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminCollectionsManagement() {
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCollections, setExpandedCollections] = useState<Set<number>>(new Set());

  // Récupérer toutes les collections
  const { data: collections, isLoading: collectionsLoading, refetch: refetchCollections } = 
    trpc.collections.getAllCollections.useQuery();

  // Récupérer toutes les ressources
  const { data: allResources, isLoading: resourcesLoading } = 
    trpc.collections.getAllResourcesForAdmin.useQuery();

  // Récupérer les ressources d'une collection
  const { data: collectionData, isLoading: collectionDataLoading } = 
    trpc.collections.getCollectionWithResources.useQuery(
      { collectionId: selectedCollectionId! },
      { enabled: !!selectedCollectionId }
    );

  // Utils pour invalider les queries
  const utils = trpc.useUtils();

  // Mutations
  const addResourceMutation = trpc.collections.addResourceAsAdmin.useMutation({
    onSuccess: () => {
      toast.success("Ressource ajoutée à la collection");
      utils.collections.getAllCollections.invalidate();
      if (selectedCollectionId) {
        utils.collections.getCollectionWithResources.invalidate({ collectionId: selectedCollectionId });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'ajout de la ressource");
    },
  });

  const removeResourceMutation = trpc.collections.removeResourceAsAdmin.useMutation({
    onSuccess: () => {
      toast.success("Ressource supprimée de la collection");
      utils.collections.getAllCollections.invalidate();
      if (selectedCollectionId) {
        utils.collections.getCollectionWithResources.invalidate({ collectionId: selectedCollectionId });
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la suppression de la ressource");
    },
  });

  // Filtrer les ressources disponibles (non dans la collection)
  const availableResources = useMemo(() => {
    if (!allResources || !collectionData) return [];
    const resourceIdsInCollection = new Set(collectionData.resources.map((r: any) => r.id));
    return allResources
      .filter((r: any) => !resourceIdsInCollection.has(r.id))
      .filter((r: any) => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allResources, collectionData, searchQuery]);

  const toggleCollectionExpanded = (collectionId: number) => {
    const newExpanded = new Set(expandedCollections);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedCollections(newExpanded);
  };

  if (collectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Collections</h1>
        <p className="text-gray-600 mt-2">Gérez les associations entre ressources et collections</p>
      </div>

      <Tabs defaultValue="collections" className="w-full">
        <TabsList>
          <TabsTrigger value="collections">Collections ({collections?.length || 0})</TabsTrigger>
          <TabsTrigger value="editor">Éditeur</TabsTrigger>
        </TabsList>

        <TabsContent value="collections" className="space-y-4">
          {collections && collections.length > 0 ? (
            <div className="space-y-3">
              {collections.map((collection: any) => (
                <Card 
                  key={collection.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div
                    className="p-4 flex items-center justify-between"
                    onClick={() => {
                      setSelectedCollectionId(collection.id);
                      toggleCollectionExpanded(collection.id);
                    }}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{collection.name}</h3>
                      <p className="text-sm text-gray-600">{collection.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary">
                          {collection.resourceCount || 0} ressources
                        </Badge>
                        {collection.isPublic === 'true' && (
                          <Badge variant="outline">Publique</Badge>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedCollections.has(collection.id) ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {expandedCollections.has(collection.id) && selectedCollectionId === collection.id && (
                    <div className="border-t p-4 space-y-4">
                      {collectionDataLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {/* Ressources dans la collection */}
                          <div>
                            <h4 className="font-semibold mb-3">Ressources dans la collection</h4>
                            {collectionData?.resources && collectionData.resources.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {collectionData.resources.map((resource: any) => (
                                  <div
                                    key={resource.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{resource.title}</p>
                                      <p className="text-xs text-gray-600">{resource.type}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => 
                                        removeResourceMutation.mutate({
                                          collectionId: collection.id,
                                          resourceId: resource.id,
                                        })
                                      }
                                      disabled={removeResourceMutation.isPending}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">Aucune ressource dans cette collection</p>
                            )}
                          </div>

                          {/* Ajouter des ressources */}
                          <div>
                            <h4 className="font-semibold mb-3">Ajouter des ressources</h4>
                            <div className="mb-3">
                              <Input
                                placeholder="Rechercher une ressource..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full"
                              />
                            </div>
                            {availableResources.length > 0 ? (
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {availableResources.map((resource: any) => (
                                  <div
                                    key={resource.id}
                                    className="flex items-center justify-between p-2 bg-blue-50 rounded"
                                  >
                                    <div className="flex-1">
                                      <p className="font-medium text-sm">{resource.title}</p>
                                      <p className="text-xs text-gray-600">{resource.type}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        addResourceMutation.mutate({
                                          collectionId: collection.id,
                                          resourceId: resource.id,
                                        })
                                      }
                                      disabled={addResourceMutation.isPending}
                                    >
                                      <Plus className="w-4 h-4 text-green-500" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-600">
                                {searchQuery ? "Aucune ressource trouvée" : "Toutes les ressources sont déjà dans cette collection"}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">Aucune collection trouvée</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
              <CardDescription>
                Utilisez l'onglet "Collections" pour gérer les associations entre ressources et collections.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Cliquez sur une collection pour l'agrandir et voir ses ressources. Vous pouvez ajouter ou supprimer des ressources en utilisant les boutons + et -.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
