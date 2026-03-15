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
  TrendingUp,
  BarChart3,
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

  const publicationRate =
    totalResources > 0 ? Math.round((publishedResources / totalResources) * 100) : 0;

  const averageViewsPerResource =
    totalResources > 0 ? (totalViews / totalResources).toFixed(1) : "0.0";

  const averageDownloadsPerResource =
    totalResources > 0 ? (totalDownloads / totalResources).toFixed(1) : "0.0";

  const engagementRatio =
    totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0;
const platformActivityLevel =
  totalViews > 1000
    ? "Très forte activité"
    : totalViews > 300
    ? "Activité soutenue"
    : totalViews > 100
    ? "Activité modérée"
    : "Activité faible";

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
            <h1 className="text-4xl font-bold mt-4">Pilotage de la plateforme</h1>
            <p className="text-muted-foreground mt-2">
              Vue consolidée de l’activité réelle de la ressourcerie ifac :
              ressources, consultations, téléchargements et niveau de publication.
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
                <CardTitle>État éditorial des ressources</CardTitle>
                <CardDescription>
                  Niveau de publication réel du fonds documentaire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Ressources approuvées</p>
                      <p className="text-sm text-muted-foreground">
                        Disponibles dans le catalogue ou prêtes à être diffusées
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{publishedResources}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">Ressources à traiter</p>
                      <p className="text-sm text-muted-foreground">
                        Brouillons et validations encore en attente
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{pendingResources}</p>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Taux de publication</p>
                      <p className="text-sm text-muted-foreground">
                        Part des ressources déjà approuvées sur l’ensemble du fonds
                      </p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{publicationRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lecture de pilotage</CardTitle>
                <CardDescription>
                  Indicateurs synthétiques pour suivre l’usage réel de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Moyenne de vues par ressource
                  </span>
                  <span className="font-semibold">{averageViewsPerResource}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Moyenne de téléchargements par ressource
                  </span>
                  <span className="font-semibold">{averageDownloadsPerResource}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Ratio téléchargements / vues
                  </span>
                  <span className="font-semibold">{engagementRatio}%</span>
                </div>

                <div className="p-4 border rounded-lg bg-muted/40">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 mt-0.5 text-primary" />
                    <div className="space-y-1">
                      <p className="font-medium">Lecture rapide</p>
                      <p className="text-sm text-muted-foreground">
                        Ce bloc permet d’évaluer si les ressources sont simplement consultées
                        ou réellement téléchargées et exploitées sur le terrain.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Activité globale de la plateforme</CardTitle>
                <CardDescription>
                  Lecture stratégique rapide de l’usage réel de la ressourcerie ifac
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Niveau d’activité</p>
                  <p className="text-2xl font-bold mt-2">{platformActivityLevel}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Interprétation basée sur le volume total de consultations enregistrées.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Vues par utilisateur</p>
                  <p className="text-2xl font-bold mt-2">
                    {totalUsers > 0 ? (totalViews / totalUsers).toFixed(1) : "0.0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Permet d’estimer l’intensité moyenne d’usage de la plateforme.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Téléchargements par utilisateur</p>
                  <p className="text-2xl font-bold mt-2">
                    {totalUsers > 0 ? (totalDownloads / totalUsers).toFixed(1) : "0.0"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Indicateur concret d’appropriation des ressources par les équipes.
                  </p>
                </div>
              </CardContent>
            </Card>
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