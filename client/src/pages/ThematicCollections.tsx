import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Loader, Search } from "lucide-react";

export default function ThematicCollections() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollectionId, setSelectedCollectionId] = useState<number | null>(null);

  // Récupérer toutes les collections thématiques
  const { data: collections = [], isLoading: collectionsLoading } = trpc.collections.listPublic.useQuery();

  // Récupérer les ressources d'une collection sélectionnée
  const { data: selectedCollection, isLoading: resourcesLoading } = trpc.collections.getCollectionWithResources.useQuery(
    { collectionId: selectedCollectionId! },
    { enabled: selectedCollectionId !== null }
  );

  // Filtrer les collections par recherche
  const filteredCollections = collections.filter(col =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (col.description && col.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Collections thématiques" }]} />

          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Collections Thématiques</h1>
            <p className="text-lg text-muted-foreground">
              Explorez nos collections de ressources organisées par thème
            </p>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher une collection..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Liste des collections */}
            <div className="lg:col-span-1">
              <h2 className="text-xl font-bold mb-4">Collections</h2>
              {collectionsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCollections.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune collection trouvée
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredCollections.map((collection) => (
                    <Button
                      key={collection.id}
                      variant={selectedCollectionId === collection.id ? "default" : "outline"}
                      className="w-full justify-between text-left"
                      onClick={() => setSelectedCollectionId(collection.id)}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{collection.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {collection.resourceCount || 0} ressources
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Détails de la collection sélectionnée */}
            <div className="lg:col-span-2">
              {selectedCollectionId === null ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <p className="text-muted-foreground">
                      Sélectionnez une collection pour voir les ressources
                    </p>
                  </CardContent>
                </Card>
              ) : resourcesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : selectedCollection ? (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedCollection.collection.name}</h2>
                    {selectedCollection.collection.description && (
                      <p className="text-muted-foreground">{selectedCollection.collection.description}</p>
                    )}
                    <div className="mt-2 text-sm text-muted-foreground">
                      {selectedCollection.resources?.length || 0} ressources
                    </div>
                  </div>

                  {selectedCollection.resources && selectedCollection.resources.length > 0 ? (
                    <div className="grid gap-4">
                      {selectedCollection.resources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                            <CardDescription className="line-clamp-2">
                              {resource.summary}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center justify-between">
                              <div className="text-sm text-muted-foreground">
                                {resource.type}
                              </div>
                              <Button variant="outline" size="sm">
                                Voir la ressource
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="text-center py-12">
                      <CardContent>
                        <p className="text-muted-foreground">
                          Aucune ressource dans cette collection
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
