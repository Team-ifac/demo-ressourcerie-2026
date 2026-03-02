import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, ArrowRight } from "lucide-react";
import { useState, useMemo } from "react";

export default function CollectionDetail() {
  const [, params] = useRoute("/collections/:slug");
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Récupérer les collections publiques pour trouver celle correspondant au slug
  const { data: publicCollections, isLoading: collectionsLoading } = 
    trpc.collections.listPublic.useQuery();

  // Trouver la collection correspondant au slug
  const collection = useMemo(() => {
    if (!publicCollections) return null;
    return publicCollections.find((c: any) => {
      const slug = c.name.toLowerCase().replace(/\s+/g, '-');
      return slug === params?.slug;
    });
  }, [publicCollections, params?.slug]);

  // Récupérer les ressources de la collection
  const { data: collectionWithResources, isLoading: resourcesLoading } =
    trpc.collections.getCollectionWithResources.useQuery(
      { collectionId: collection?.id! },
      { enabled: !!collection?.id }
    );

  const collectionResources = collectionWithResources?.resources ?? [];

  // Filtrer les ressources par recherche
  const filteredResources = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return collectionResources.filter((resource: any) => {
      const title = (resource?.title ?? "").toLowerCase();
      const summary = (resource?.summary ?? "").toLowerCase();
      return title.includes(q) || summary.includes(q);
    });
  }, [collectionResources, searchQuery]);

  if (collectionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">Collection non trouvée</p>
                <div className="flex justify-center mt-4">
                  <Button onClick={() => navigate("/resources")}>
                    Retour aux ressources
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          {/* En-tête de la collection */}
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => navigate("/resources")}>
              ← Retour aux ressources
            </Button>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">{collection.name}</h1>
              <p className="text-xl text-muted-foreground">{collection.description}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {filteredResources.length} ressource{filteredResources.length !== 1 ? 's' : ''}
                </Badge>
                {collection.accessLevel === "PUBLIC" && (
                  <Badge variant="outline">Publique</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une ressource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Liste des ressources */}
          {resourcesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource: any) => (
                <Card 
                  key={resource.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/resources/${resource.id}`)}
                >
                  {resource.thumbnailUrl && resource.accessLevel !== "PREMIUM" && (
  <div className="aspect-video overflow-hidden rounded-t-lg">
    <img
      src={resource.thumbnailUrl}
      alt={resource.title}
      className="w-full h-full object-cover hover:scale-105 transition-transform"
    />
  </div>
)}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {resource.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                      {resource.type && (
                        <Badge variant="secondary" className="text-xs">
                          {resource.type}
                        </Badge>
                      )}
                      {resource.ageRange && (
                        <Badge variant="outline" className="text-xs">
                          {resource.ageRange}
                        </Badge>
                      )}
                      {resource.duration && (
                        <Badge variant="outline" className="text-xs">
                          {resource.duration}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/resources/${resource.id}`);
                      }}
                    >
                      Voir la ressource
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-gray-600">
                  {searchQuery ? "Aucune ressource ne correspond à votre recherche" : "Aucune ressource dans cette collection"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
