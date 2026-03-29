import { useMemo, useState } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Star, Search, Plus, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

type CollectionRow = {
  id: number;
  name?: string | null;
  title?: string | null;
  description?: string | null;
};

type ResourceRow = {
  id: number;
  title?: string | null;
  summary?: string | null;
  accessLevel?: string | null;
  status?: string | null;
};

const IFAC_A_LA_UNE_COLLECTION_NAME = "ifac à la une";

function formatAccessLevel(value?: string | null) {
  if (value === "PUBLIC") return "Public";
  if (value === "INTERNAL_IFAC") return "Interne ifac";
  if (value === "PREMIUM") return "Premium";
  return "—";
}

function formatStatus(value?: string | null) {
  if (value === "approved") return "Approuvée";
  if (value === "pending") return "En attente";
  if (value === "draft") return "Brouillon";
  if (value === "rejected") return "Refusée";
  return "—";
}

export default function AdminIfacALaUne() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");

  const collectionsQuery = trpc.collections.getAllCollections.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const allResourcesQuery = trpc.resources.getAllResourcesForAdmin.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const featuredCollection = useMemo(() => {
    const rows = (collectionsQuery.data ?? []) as CollectionRow[];
    return (
      rows.find(
        (row) =>
          String(row.name ?? "").trim().toLowerCase() === IFAC_A_LA_UNE_COLLECTION_NAME
      ) ?? null
    );
  }, [collectionsQuery.data]);

  const featuredCollectionId = featuredCollection?.id ?? null;

  const featuredResourcesQuery = trpc.collections.getCollectionWithResources.useQuery(
    featuredCollectionId ? { collectionId: featuredCollectionId } : undefined!,
    {
      enabled: !!featuredCollectionId && user?.role === "admin",
    }
  );

  const createCollectionMutation = trpc.collections.create.useMutation({
    onSuccess: async () => {
      await utils.collections.getAllCollections.invalidate();
    },
  });

  const addResourceMutation = trpc.collections.addResourceAsAdmin.useMutation({
    onSuccess: async () => {
      if (featuredCollectionId) {
        await utils.collections.getCollectionWithResources.invalidate({
          collectionId: featuredCollectionId,
        });
      }
    },
  });

  const removeResourceMutation = trpc.collections.removeResourceAsAdmin.useMutation({
    onSuccess: async () => {
      if (featuredCollectionId) {
        await utils.collections.getCollectionWithResources.invalidate({
          collectionId: featuredCollectionId,
        });
      }
    },
  });

  const handleCreateCollection = async () => {
    try {
      await createCollectionMutation.mutateAsync({
        name: IFAC_A_LA_UNE_COLLECTION_NAME,
        description: "Sélection éditoriale mise en avant sur la page d’accueil",
        isPublic: false,
      });
      alert("Collection “ifac à la une” créée.");
    } catch (error: any) {
      alert(error?.message || "Erreur lors de la création de la collection.");
    }
  };

  const handleAddResource = async (resourceId: number) => {
    if (!featuredCollectionId) return;

    try {
      await addResourceMutation.mutateAsync({
        collectionId: featuredCollectionId,
        resourceId,
      });
    } catch (error: any) {
      alert(error?.message || "Erreur lors de l’ajout.");
    }
  };

  const handleRemoveResource = async (resourceId: number) => {
    if (!featuredCollectionId) return;

    try {
      await removeResourceMutation.mutateAsync({
        collectionId: featuredCollectionId,
        resourceId,
      });
    } catch (error: any) {
      alert(error?.message || "Erreur lors de la suppression.");
    }
  };

  const featuredResources = ((featuredResourcesQuery.data?.resources ?? []) as ResourceRow[]) || [];
  const featuredIds = new Set(featuredResources.map((resource) => Number(resource.id)));

  const allResources = ((allResourcesQuery.data ?? []) as ResourceRow[]) || [];
  const normalizedSearch = search.trim().toLowerCase();

  const filteredAvailableResources = allResources
    .filter((resource) => !featuredIds.has(Number(resource.id)))
    .filter((resource) => {
      if (!normalizedSearch) return true;

      const title = String(resource.title ?? "").toLowerCase();
      const summary = String(resource.summary ?? "").toLowerCase();

      return title.includes(normalizedSearch) || summary.includes(normalizedSearch);
    })
    .slice(0, 50);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb
            items={[
              { label: "Administration" },
              { label: "ifac à la une" },
            ]}
          />

          <div className="space-y-3">
            <h1 className="text-4xl font-bold">ifac à la une</h1>
            <p className="text-lg text-muted-foreground">
              Gérer les ressources mises en avant sur la page d’accueil.
            </p>
          </div>

          {!featuredCollection && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle>Collection éditoriale absente</CardTitle>
                <CardDescription>
                  La collection “ifac à la une” n’existe pas encore. Il faut la créer une seule fois.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={handleCreateCollection}
                  disabled={createCollectionMutation.isPending}
                  className="gap-2"
                >
                  <Star className="h-4 w-4" />
                  {createCollectionMutation.isPending
                    ? "Création en cours..."
                    : "Créer la collection ifac à la une"}
                </Button>
              </CardContent>
            </Card>
          )}

          {featuredCollection && (
            <>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Ressources actuellement mises en avant</CardTitle>
                    <CardDescription>
                      Ce bloc alimente directement la section “⭐ ifac à la une” sur la page d’accueil.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {featuredResources.length === 0 ? (
                      <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                        Aucune ressource n’est encore mise en avant.
                      </div>
                    ) : (
                      featuredResources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                        >
                          <div className="min-w-0">
                            <p className="font-medium break-words">
                              {resource.title || "Ressource sans titre"}
                            </p>

                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary">
                                {formatAccessLevel(resource.accessLevel)}
                              </Badge>
                              <Badge variant="outline">
                                {formatStatus(resource.status)}
                              </Badge>
                            </div>
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => handleRemoveResource(Number(resource.id))}
                            disabled={removeResourceMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                            Retirer
                          </Button>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ajouter une ressource</CardTitle>
                    <CardDescription>
                      Recherche dans les ressources existantes pour les ajouter à “ifac à la une”.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher une ressource..."
                        className="pl-9"
                      />
                    </div>

                    <div className="space-y-3">
                      {filteredAvailableResources.length === 0 ? (
                        <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                          Aucune ressource disponible pour cette recherche.
                        </div>
                      ) : (
                        filteredAvailableResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="flex items-start justify-between gap-4 p-4 border rounded-lg"
                          >
                            <div className="min-w-0">
                              <p className="font-medium break-words">
                                {resource.title || "Ressource sans titre"}
                              </p>

                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="secondary">
                                  {formatAccessLevel(resource.accessLevel)}
                                </Badge>
                                <Badge variant="outline">
                                  {formatStatus(resource.status)}
                                </Badge>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="gap-2"
                              onClick={() => handleAddResource(Number(resource.id))}
                              disabled={addResourceMutation.isPending}
                            >
                              <Plus className="h-4 w-4" />
                              Ajouter
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}