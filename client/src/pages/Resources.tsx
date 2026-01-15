import { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, Filter, Heart, Download, Lock, Globe } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";

export default function Resources() {
  const [search, setSearch] = useState("");
  const [selectedCollections, setSelectedCollections] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const { user } = useAuth();
  const [location] = useLocation();
  const utils = trpc.useUtils();

  // Parse URL parameters directly from location
  const params = new URLSearchParams(location.split('?')[1] || '');
  const categoryFromUrl = params.get('categorie') ? decodeURIComponent(params.get('categorie')!) : undefined;
  
  // Initialize category filter from URL and invalidate cache
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    } else {
      setSelectedCategory("");
    }
    // Invalidate the query cache to force refetch with new parameters
    utils.resources.list.invalidate();
  }, [location, utils]); // Depend on location

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery({
    search: search || undefined,
    collectionIds: selectedCollections.length > 0 ? selectedCollections : undefined,
    type: selectedType || params.get('type') || undefined,
    ageRange: selectedAgeRange || undefined,
    duration: selectedDuration || undefined,
    category: categoryFromUrl || undefined, // Use categoryFromUrl directly
  });

  const { data: collections = [] } = trpc.collections.listPublic.useQuery();

  const clearFilters = () => {
    setSearch("");
    setSelectedCollections([]);
    setSelectedType("");
    setSelectedAgeRange("");
    setSelectedDuration("");
    setSelectedCategory("");
  };

  const hasFilters = search || selectedCollections.length > 0 || selectedType || selectedAgeRange || selectedDuration || selectedCategory;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ressources" }]} />

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Catalogue de ressources</h1>
            <p className="text-lg text-muted-foreground">
              Explorez notre collection de ressources pédagogiques. 
              {!user && " Connectez-vous pour accéder aux ressources internes IFAC."}
            </p>
            {/* Recherche avancée */}
            <div className="bg-accent/50 rounded-lg p-6 border border-border">
              <h2 className="text-lg font-semibold mb-4">Recherche avancée</h2>
              <AdvancedSearch />
            </div>
          </div>

          {/* Filtres */}
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle>Filtres de recherche</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher par mots-clés..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type de ressource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Tous les types</SelectItem>
                    <SelectItem value="Fiche">Fiche</SelectItem>
                    <SelectItem value="Kit clé en main">Kit clé en main</SelectItem>
                    <SelectItem value="Projet">Projet</SelectItem>
                    <SelectItem value="Article">Article</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tranche d'âge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Tous les âges</SelectItem>
                    <SelectItem value="3-6 ans">3-6 ans</SelectItem>
                    <SelectItem value="6-12 ans">6-12 ans</SelectItem>
                    <SelectItem value="12-18 ans">12-18 ans</SelectItem>
                    <SelectItem value="Tous âges">Tous âges</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=" ">Toutes durées</SelectItem>
                    <SelectItem value="30 min">30 min</SelectItem>
                    <SelectItem value="1-2h">1-2h</SelectItem>
                    <SelectItem value="Demi-journée">Demi-journée</SelectItem>
                    <SelectItem value="Journée">Journée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {collections.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Thématiques</p>
                  <div className="flex flex-wrap gap-2">
                    {collections.map((collection) => (
                      <Badge
                        key={collection.id}
                        variant={selectedCollections.includes(collection.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setSelectedCollections((prev) =>
                            prev.includes(collection.id)
                              ? prev.filter((id) => id !== collection.id)
                              : [...prev, collection.id]
                          );
                        }}
                      >
                        {collection.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {hasFilters && (
                <Button variant="outline" onClick={clearFilters} className="w-full md:w-auto">
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Résultats */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Chargement..." : `${resources.length} ressource${resources.length > 1 ? 's' : ''} trouvée${resources.length > 1 ? 's' : ''}`}
              </p>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-3 bg-muted rounded w-full" />
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : resources.length === 0 ? (
              <Card className="py-12">
                <CardContent className="text-center space-y-2">
                  <p className="text-lg font-medium">Aucune ressource trouvée</p>
                  <p className="text-muted-foreground">
                    Essayez de modifier vos critères de recherche
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => (
                  <Link key={resource.id} href={`/resources/${resource.id}`}>
                    <Card className="h-full hover:shadow-elegant transition-all duration-300 cursor-pointer group">
                      {resource.thumbnailUrl && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                            {resource.title}
                          </CardTitle>
                          {resource.visibility === "INTERNAL_IFAC" ? (
                            <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <CardDescription className="line-clamp-2">
                          {resource.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {resource.type && (
                            <Badge variant="secondary">{resource.type}</Badge>
                          )}
                          {resource.ageRange && (
                            <Badge variant="outline">{resource.ageRange}</Badge>
                          )}
                          {resource.duration && (
                            <Badge variant="outline">{resource.duration}</Badge>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">
                          {resource.visibility === "PUBLIC" ? "Public" : "Interne IFAC"}
                        </span>
                        <div className="flex gap-2">
                          {user && (
                            <FavoriteButton resourceId={resource.id} />
                          )}
                          {resource.fileUrl && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={resource.fileUrl} download>
                                <Download className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
