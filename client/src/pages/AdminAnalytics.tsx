import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Eye,
  Users,
  FileText,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminAnalytics() {
  const statsQuery = trpc.admin.stats.getPlatformStats.useQuery();

  const stats = (statsQuery.data ?? {}) as any;
  const counters = (stats.counters ?? {}) as any;

  const totalDownloads = Number(counters.totalDownloads ?? 0);
  const totalUsers = Number(counters.totalUsers ?? 0);
  const totalResources = Number(counters.totalResources ?? 0);
  const totalViews = Number(counters.totalViews ?? 0);
  const publishedResources = Number(counters.publishedResources ?? 0);
  const pendingResources = Number(counters.pendingResources ?? 0);

  const topDownloaded = Array.isArray(stats.topDownloaded)
    ? stats.topDownloaded.map((resource: any, index: number) => ({
        id: resource.id ?? index,
        title: resource.title ?? "Ressource sans titre",
        status: resource.status ?? null,
        accessLevel: resource.accessLevel ?? null,
        downloadCount: Number(resource.downloadCount ?? 0),
      }))
    : [];

  const topViewed = Array.isArray(stats.topViewed)
    ? stats.topViewed.map((resource: any, index: number) => ({
        id: resource.id ?? index,
        title: resource.title ?? "Ressource sans titre",
        status: resource.status ?? null,
        accessLevel: resource.accessLevel ?? null,
        viewCount: Number(resource.viewCount ?? 0),
      }))
    : [];

  const formatAccessLevel = (value: string | null) => {
    if (value === "PUBLIC") return "Public";
    if (value === "INTERNAL_IFAC") return "Interne ifac";
    if (value === "PREMIUM") return "Premium";
    return "—";
  };

  const formatStatus = (value: string | null) => {
    if (value === "approved") return "Approuvée";
    if (value === "pending") return "En attente";
    if (value === "draft") return "Brouillon";
    if (value === "rejected") return "Refusée";
    return "—";
  };

  if (statsQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container space-y-8">
            <div>
              <Breadcrumb items={[{ label: "Admin" }, { label: "Analytics" }]} />
              <h1 className="text-4xl font-bold mt-4">Dashboard Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Chargement des statistiques plateforme...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (statsQuery.error) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container space-y-8">
            <div>
              <Breadcrumb items={[{ label: "Admin" }, { label: "Analytics" }]} />
              <h1 className="text-4xl font-bold mt-4">Dashboard Analytics</h1>
              <p className="text-destructive mt-2">
                Erreur lors du chargement des statistiques plateforme.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <div>
            <Breadcrumb items={[{ label: "Admin" }, { label: "Analytics" }]} />
            <h1 className="text-4xl font-bold mt-4">Dashboard Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Vue réelle des indicateurs principaux de la plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Téléchargements</p>
                    <Download className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold">{totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">
                    Donnée backend réelle
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Utilisateurs</p>
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground">
                    Donnée backend réelle
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Ressources</p>
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold">{totalResources}</p>
                  <p className="text-xs text-muted-foreground">
                    Donnée backend réelle
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Vues totales</p>
                    <Eye className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">{totalViews}</p>
                  <p className="text-xs text-muted-foreground">
                    Donnée backend réelle
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>État des ressources</CardTitle>
                <CardDescription>
                  Répartition réelle des ressources côté plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Ressources approuvées</p>
                      <p className="text-sm text-muted-foreground">
                        Disponibles ou prêtes côté catalogue
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{publishedResources}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Ressources en attente</p>
                      <p className="text-sm text-muted-foreground">
                        Brouillons ou validations à traiter
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{pendingResources}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Résumé plateforme</CardTitle>
                <CardDescription>
                  Lecture rapide des indicateurs actuels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total ressources
                  </span>
                  <span className="font-semibold">{totalResources}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total utilisateurs
                  </span>
                  <span className="font-semibold">{totalUsers}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total téléchargements
                  </span>
                  <span className="font-semibold">{totalDownloads}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total vues
                  </span>
                  <span className="font-semibold">{totalViews}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ressources approuvées
                  </span>
                  <span className="font-semibold">{publishedResources}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ressources en attente
                  </span>
                  <span className="font-semibold">{pendingResources}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top téléchargements</CardTitle>
                <CardDescription>
                  Ressources les plus téléchargées actuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topDownloaded.length === 0 ? (
                    <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                      Aucun téléchargement enregistré pour le moment.
                    </div>
                  ) : (
                    topDownloaded.map((resource: any, index: number) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <Badge
                              variant="outline"
                              className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
                            >
                              {index + 1}
                            </Badge>
                            <div className="min-w-0">
                              <p className="font-medium break-words">
                                {resource.title}
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
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold">{resource.downloadCount}</p>
                          <p className="text-sm text-muted-foreground">
                            téléchargements
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top vues</CardTitle>
                <CardDescription>
                  Ressources les plus consultées actuellement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topViewed.length === 0 ? (
                    <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                      Aucune vue enregistrée pour le moment.
                    </div>
                  ) : (
                    topViewed.map((resource: any, index: number) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <Badge
                              variant="outline"
                              className="w-8 h-8 flex items-center justify-center rounded-full shrink-0"
                            >
                              {index + 1}
                            </Badge>
                            <div className="min-w-0">
                              <p className="font-medium break-words">
                                {resource.title}
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
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold">{resource.viewCount}</p>
                          <p className="text-sm text-muted-foreground">
                            vues
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}