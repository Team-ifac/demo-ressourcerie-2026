import { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { AdvancedSearch } from "@/components/AdvancedSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Search, Filter, Download, ExternalLink, Lock } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { readingLabel } from "@/lib/resourcePolicy";
import { AccessDeniedModal } from "@/components/AccessDeniedModal";

export default function Resources() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);

  // ✅ Modal "accès refusé" (catalogue)
  const [accessDenied, setAccessDenied] = useState<{
    isOpen: boolean;
    resourceTitle: string;
    accessLevel: "INTERNAL_IFAC" | "PREMIUM";
  }>({
    isOpen: false,
    resourceTitle: "",
    accessLevel: "INTERNAL_IFAC",
  });

  const { user } = useAuth();
  const { data: me } = trpc.auth.me.useQuery();
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();

  // Parse URL parameters directly from location
  const params = new URLSearchParams(location.split("?")[1] || "");
  const categoryFromUrl = params.get("categorie")
    ? decodeURIComponent(params.get("categorie")!)
    : undefined;

  // Initialize category filter from URL and invalidate cache
  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setSelectedCategoryKey(categoryFromUrl);
    } else {
      setSelectedCategory("");
      setSelectedCategoryKey("");
    }
    setCurrentPage(1);
    utils.resources.listPaginated.invalidate();
    utils.resources.listCategories.invalidate();
  }, [location, utils, categoryFromUrl]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);

  const { data: paginatedResources, isLoading } = trpc.resources.listPaginated.useQuery({
    search: debouncedSearch || undefined,
    type: selectedType || params.get("type") || undefined,
    ageRange: selectedAgeRange || undefined,
    duration: selectedDuration || undefined,
    category: selectedCategoryKey || undefined,
    page: currentPage,
    limit: 24,
  });

  const resources = paginatedResources?.items ?? [];
  const isSearchCapped = !!paginatedResources?.isSearchCapped;
  const searchPrefetchLimit = paginatedResources?.searchPrefetchLimit ?? null;

  const { data: categoryCounts = [] } =
    trpc.resources.listCategoriesWithCounts.useQuery();

  const categories = categoryCounts.map((item) => item.key);

  const pagination = paginatedResources?.pagination;

  const clearFilters = () => {
    setSearch("");
    setSelectedType("");
    setSelectedAgeRange("");
    setSelectedDuration("");
    setSelectedCategory("");
    setSelectedCategoryKey("");
    setCurrentPage(1);
  };

  const hasFilters =
    search ||
    selectedType ||
    selectedAgeRange ||
    selectedDuration ||
    selectedCategoryKey;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ressources" }]} />

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Catalogue de ressources</h1>
            <p className="text-lg text-muted-foreground">
              Explorez notre collection de ressources pédagogiques.
              {!user && " Connectez-vous pour accéder aux ressources internes ifac."}
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
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select
                  value={selectedType}
                  onValueChange={(value) => {
                    setSelectedType(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type de ressource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    <SelectItem value="Fiche">Fiche</SelectItem>
                    <SelectItem value="Kit clé en main">Kit clé en main</SelectItem>
                    <SelectItem value="Projet">Projet</SelectItem>
                    <SelectItem value="Article">Article</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedAgeRange}
                  onValueChange={(value) => {
                    setSelectedAgeRange(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tranche d'âge" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les âges</SelectItem>
                    <SelectItem value="3-6 ans">3-6 ans</SelectItem>
                    <SelectItem value="6-12 ans">6-12 ans</SelectItem>
                    <SelectItem value="12-18 ans">12-18 ans</SelectItem>
                    <SelectItem value="Tous âges">Tous âges</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={selectedDuration}
                  onValueChange={(value) => {
                    setSelectedDuration(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Durée" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes durées</SelectItem>
                    <SelectItem value="30 min">30 min</SelectItem>
                    <SelectItem value="1-2h">1-2h</SelectItem>
                    <SelectItem value="Demi-journée">Demi-journée</SelectItem>
                    <SelectItem value="Journée">Journée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Catégories pédagogiques</p>
                  <div className="flex flex-wrap gap-2">
                    {categoryCounts.map((item) => {
  const category = item.key;
  const isSelected = selectedCategoryKey === category;

  const label = category
    .split("/")
    .map((part) =>
      part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" / ");

  return (
    <Badge
      key={category}
      variant={isSelected ? "default" : "outline"}
      className="cursor-pointer transition-colors"
      onClick={() => {
        const nextValue = selectedCategoryKey === category ? "" : category;
        setSelectedCategoryKey(nextValue);
        setSelectedCategory(nextValue);
        setCurrentPage(1);
      }}
    >
      {label} ({item.count})
    </Badge>
  );
})}
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
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {isLoading
                    ? "Chargement..."
                    : `${pagination?.total ?? resources.length} ressource${
                        (pagination?.total ?? resources.length) > 1 ? "s" : ""
                      } trouvée${(pagination?.total ?? resources.length) > 1 ? "s" : ""}`}
                </p>
              </div>

              {!isLoading && isSearchCapped && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <p className="text-sm text-amber-900">
                    La recherche a été limitée aux{" "}
                    <span className="font-semibold">
                      {searchPrefetchLimit ?? 300} premiers résultats pertinents
                    </span>{" "}
                    pour garantir de bonnes performances. Affine votre recherche pour obtenir des résultats plus précis.
                  </p>
                </div>
              )}
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
                  <p className="text-muted-foreground">Essayez de modifier vos critères de recherche</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.map((resource) => {
                  const rawAccessLevel = (resource as any).accessLevel as
                    | "PUBLIC"
                    | "INTERNAL_IFAC"
                    | "PREMIUM"
                    | undefined;

                  const accessLevel = (rawAccessLevel ?? "PUBLIC") as
                    | "PUBLIC"
                    | "INTERNAL_IFAC"
                    | "PREMIUM";

                  const visibility = (resource as any).visibility as "PUBLIC" | "INTERNAL_IFAC";

                  // ✅ Catalogue audit-proof :
                  // En navigation privée, on ne navigue que si le serveur a EXPLICITEMENT indiqué PUBLIC.
                  // Si accessLevel est absent → on bloque (modal).
                  const canNavigateFromCatalog =
                    rawAccessLevel === "PUBLIC" && visibility !== "INTERNAL_IFAC";

                  // ✅ Règle simple :
                  // - PUBLIC => on laisse cliquer (ouvre la fiche)
                  // - INTERNAL_IFAC / PREMIUM => si pas connecté (ou pas premium), on ouvre le modal au lieu de naviguer
                  const isLockedByAccess =
                    accessLevel === "PREMIUM" || accessLevel === "INTERNAL_IFAC" || visibility === "INTERNAL_IFAC";

                  const canOpen = Boolean((resource as any).canOpen);

                  const openDeniedModal = () => {
                    const needed: "INTERNAL_IFAC" | "PREMIUM" =
                      accessLevel === "PREMIUM" ? "PREMIUM" : "INTERNAL_IFAC";

                    setAccessDenied({
                      isOpen: true,
                      resourceTitle: resource.title,
                      accessLevel: needed,
                    });
                  };

                  const isPremiumLocked =
                    (resource as any).accessLevel === "PREMIUM" && !(resource as any).canOpen;

                  const CardClickableContent = (
                    <>
                      {resource.thumbnailUrl && (resource as any).accessLevel !== "PREMIUM" && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}

                      {(resource as any).accessLevel === "PREMIUM" && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted relative">
                          {resource.thumbnailUrl ? (
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted" />
                          )}

                          <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-2">
                              <Lock className="h-8 w-8 text-white" />
                              <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
                                Ressource premium
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                            {resource.title}
                          </CardTitle>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {resource.visibility === "INTERNAL_IFAC" ? (
                              <Badge variant="secondary">Interne ifac</Badge>
                            ) : (
                              <Badge variant="outline">Public</Badge>
                            )}

                            {(resource as any).accessLevel === "PREMIUM" && (
                              <Badge variant="destructive">Premium</Badge>
                            )}
                          </div>
                        </div>

                        <CardDescription className="line-clamp-2">
                          {resource.summary}
                        </CardDescription>
                      </CardHeader>

                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {resource.type && <Badge variant="secondary">{resource.type}</Badge>}
                          {resource.ageRange && <Badge variant="outline">{resource.ageRange}</Badge>}
                          {resource.duration && <Badge variant="outline">{resource.duration}</Badge>}
                        </div>

                        {isPremiumLocked && (
                          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3">
                            <p className="text-sm font-medium text-amber-900">
                              Ressource réservée aux adhérents ifac.
                            </p>

                            <p className="text-sm text-amber-800">
                              Adhérez pour débloquer l’accès aux contenus premium de la ressourcerie.
                            </p>

                            <a
                              href="https://adhesion.ifac.asso.fr/"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex"
                            >
                              <Button
                                type="button"
                                size="sm"
                                className="gap-2"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Adhérer à ifac
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </>
                  );

 return (
  <Card
    key={resource.id}
    className="h-full hover:shadow-elegant transition-all duration-300 group"
  >
    <button
      type="button"
      className="block w-full text-left cursor-pointer bg-transparent p-0 border-0 appearance-none"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const needsPremium = accessLevel === "PREMIUM";
        const needsInternal =
          accessLevel === "INTERNAL_IFAC" || visibility === "INTERNAL_IFAC";

        // ✅ Règle produit retenue :
        // - depuis le catalogue, une ressource premium ouvre toujours la modale premium
        // - une ressource interne non ouvrable ouvre la modale d'accès refusé
        // - seules les ressources réellement ouvrables naviguent vers la fiche
        if (needsPremium) {
          setAccessDenied({
            isOpen: true,
            resourceTitle: resource.title,
            accessLevel: "PREMIUM",
          });
          return;
        }

        if (needsInternal && !canOpen) {
          setAccessDenied({
            isOpen: true,
            resourceTitle: resource.title,
            accessLevel: "INTERNAL_IFAC",
          });
          return;
        }

        setLocation(`/resources/${resource.id}`);
      }}
    >
      {CardClickableContent}
    </button>

    <CardFooter className="flex justify-between items-center">
      <span className="text-sm text-muted-foreground">
        {readingLabel({
          visibility: resource.visibility,
          accessLevel: (resource as any).accessLevel,
        })}
      </span>

      <div className="flex gap-2">
        {user ? (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <FavoriteButton resourceId={resource.id} />
          </div>
        ) : null}

        {(resource as any).hasFile && (resource as any).canOpen ? (
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.assign(`/api/resources/download/${resource.id}`);
            }}
            title="Télécharger"
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </CardFooter>
  </Card>
);
                })}
              </div>
            )}

            {!isLoading && (pagination?.totalPages ?? 0) > 1 && !isSearchCapped && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Page {pagination?.page ?? 1} sur {pagination?.totalPages ?? 1}
                </p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    disabled={!pagination?.hasPreviousPage}
                    onClick={() => {
                      if (pagination?.hasPreviousPage) {
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    Précédent
                  </Button>

                  <Button
                    variant="outline"
                    disabled={!pagination?.hasNextPage}
                    onClick={() => {
                      if (pagination?.hasNextPage) {
                        setCurrentPage((prev) => prev + 1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    }}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ✅ Modal affiché depuis le catalogue */}
        <AccessDeniedModal
          isOpen={accessDenied.isOpen}
          onClose={() => setAccessDenied((s) => ({ ...s, isOpen: false }))}
          resourceTitle={accessDenied.resourceTitle}
          accessLevel={accessDenied.accessLevel}
          isAuthenticated={!!user}
        />
      </main>
    </div>
  );
}