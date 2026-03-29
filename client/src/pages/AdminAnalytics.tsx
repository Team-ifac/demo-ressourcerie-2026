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
  const statsQuery = trpc.admin.stats.getPlatformStats.useQuery(undefined, {
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const stats = (statsQuery.data ?? {}) as any;
  const counters = (stats.counters ?? {}) as any;

  const totalDownloads = Number(counters.totalDownloads ?? 0);
  const totalUsers = Number(counters.totalUsers ?? 0);
  const totalResources = Number(counters.totalResources ?? 0);
  const totalViews = Number(counters.totalViews ?? 0);
  const publishedResources = Number(counters.publishedResources ?? 0);
  const pendingResources = Number(counters.pendingResources ?? 0);
  const neverViewedCount = Number(counters.neverViewedCount ?? 0);
  const neverDownloadedCount = Number(counters.neverDownloadedCount ?? 0);
  const unusedResourcesCount = Number(counters.unusedResourcesCount ?? 0);

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
        viewCount: Number(resource.viewCount ?? 0),
      }))
    : [];

  const topViewed = Array.isArray(stats.topViewed)
    ? stats.topViewed.map((resource: any, index: number) => ({
        id: resource.id ?? index,
        title: resource.title ?? "Ressource sans titre",
        status: resource.status ?? null,
        accessLevel: resource.accessLevel ?? null,
        viewCount: Number(resource.viewCount ?? 0),
        downloadCount: Number(resource.downloadCount ?? 0),
      }))
    : [];

  const recentDownloads = Array.isArray(stats.recentDownloads)
    ? stats.recentDownloads.map((item: any) => ({
        day: String(item.day ?? ""),
        count: Number(item.count ?? 0),
      }))
    : [];

  const recentViews = Array.isArray(stats.recentViews)
    ? stats.recentViews.map((item: any) => ({
        day: String(item.day ?? ""),
        count: Number(item.count ?? 0),
      }))
    : [];

  const neverViewed = Array.isArray(stats.neverViewed)
    ? stats.neverViewed.map((resource: any, index: number) => ({
        id: resource.id ?? index,
        title: resource.title ?? "Ressource sans titre",
        status: resource.status ?? null,
        accessLevel: resource.accessLevel ?? null,
        viewCount: Number(resource.viewCount ?? 0),
        createdAt: resource.createdAt ?? null,
      }))
    : [];

  const neverDownloaded = Array.isArray(stats.neverDownloaded)
    ? stats.neverDownloaded.map((resource: any, index: number) => ({
        id: resource.id ?? index,
        title: resource.title ?? "Ressource sans titre",
        status: resource.status ?? null,
        accessLevel: resource.accessLevel ?? null,
        viewCount: Number(resource.viewCount ?? 0),
        createdAt: resource.createdAt ?? null,
      }))
    : [];

  const maxRecentDownloads = Math.max(
    1,
    ...recentDownloads.map((item: { day: string; count: number }) => item.count)
  );

  const maxRecentViews = Math.max(
    1,
    ...recentViews.map((item: { day: string; count: number }) => item.count)
  );

  const totalRecentDownloads = recentDownloads.reduce(
    (sum: number, item: { day: string; count: number }) => sum + item.count,
    0
  );

  const totalRecentViews = recentViews.reduce(
    (sum: number, item: { day: string; count: number }) => sum + item.count,
    0
  );

  const averageRecentDownloadsPerDay =
    recentDownloads.length > 0
      ? (totalRecentDownloads / recentDownloads.length).toFixed(1)
      : "0.0";

  const averageRecentViewsPerDay =
    recentViews.length > 0
      ? (totalRecentViews / recentViews.length).toFixed(1)
      : "0.0";

  const activeDownloadDays = recentDownloads.filter(
    (item: { day: string; count: number }) => item.count > 0
  ).length;

  const activeViewDays = recentViews.filter(
    (item: { day: string; count: number }) => item.count > 0
  ).length;

  const formatShortDay = (day: string) => {
    const value = String(day ?? "");
    return value.length >= 10 ? value.slice(5) : value;
  };

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

  const getConversionRateValue = (downloadCount: number, viewCount: number) => {
    if (viewCount <= 0) return 0;
    return Math.round((downloadCount / viewCount) * 100);
  };

  const formatConversionRate = (downloadCount: number, viewCount: number) => {
    if (viewCount <= 0) return "—";
    return `${getConversionRateValue(downloadCount, viewCount)}%`;
  };

  const getConversionBadgeVariant = (
    value: number
  ): "default" | "secondary" | "destructive" => {
    if (value >= 15) return "default";       // Bon
    if (value >= 5) return "secondary";      // Moyen
    return "destructive";                   // Faible
  };

  const getConversionLabel = (value: number) => {
    if (value >= 15) return "Bon";
    if (value >= 5) return "Moyen";
    return "Faible";
  };

  const getConversionDisplayText = (downloadCount: number, viewCount: number) => {
    if (viewCount < 10) {
      return "Faible (peu de données)";
    }

    const rateValue = getConversionRateValue(downloadCount, viewCount);
    return `${getConversionLabel(rateValue)} ${formatConversionRate(downloadCount, viewCount)}`;
  };

  if (statsQuery.isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container space-y-8">
            <div>
              <Breadcrumb items={[{ label: "Administration" }, { label: "Analytics" }]} />
              <h1 className="text-4xl font-bold mt-4">Pilotage de la plateforme</h1>
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
              <Breadcrumb items={[{ label: "Administration" }, { label: "Analytics" }]} />
              <h1 className="text-4xl font-bold mt-4">Pilotage de la plateforme</h1>
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
            <Breadcrumb items={[{ label: "Administration" }, { label: "Analytics" }]} />
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
                    <p className="text-sm text-muted-foreground">Téléchargements globaux</p>
                    <Download className="h-4 w-4 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold">{totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">
                    Historique global de la plateforme
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
              <CardContent className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
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

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Jamais vues</p>
                  <p className="text-2xl font-bold mt-2">{neverViewedCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ressources encore jamais consultées.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Jamais téléchargées</p>
                  <p className="text-2xl font-bold mt-2">{neverDownloadedCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ressources jamais exploitées en téléchargement.
                  </p>
                </div>

                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Totalement inutilisées</p>
                  <p className="text-2xl font-bold mt-2">{unusedResourcesCount}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Ni vues ni téléchargées à ce jour.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Activité des 30 derniers jours</CardTitle>
                <CardDescription>
                  Lecture synthétique et visualisation quotidienne des téléchargements et des vues sur les 30 derniers jours.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Téléchargements sur 30 jours</p>
                    <p className="text-2xl font-bold mt-2">{totalRecentDownloads}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cumul des téléchargements récents observés.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Vues sur 30 jours</p>
                    <p className="text-2xl font-bold mt-2">{totalRecentViews}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Cumul des consultations récentes observées.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Moyenne téléchargements / jour</p>
                    <p className="text-2xl font-bold mt-2">{averageRecentDownloadsPerDay}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {activeDownloadDays} jour{activeDownloadDays > 1 ? "s" : ""} actif{activeDownloadDays > 1 ? "s" : ""} sur la période.
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Moyenne vues / jour</p>
                    <p className="text-2xl font-bold mt-2">{averageRecentViewsPerDay}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {activeViewDays} jour{activeViewDays > 1 ? "s" : ""} actif{activeViewDays > 1 ? "s" : ""} sur la période.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-medium">Téléchargements par jour</p>
                      <p className="text-xs text-muted-foreground">
                        Max : {maxRecentDownloads}
                      </p>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-auto pr-1">
                      {recentDownloads.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucune donnée disponible.
                        </p>
                      ) : (
                        recentDownloads.map((item: { day: string; count: number }) => (
                          <div key={`download-${item.day}`} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {formatShortDay(item.day)}
                              </span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${Math.max(
                                    item.count > 0 ? 4 : 0,
                                    (item.count / maxRecentDownloads) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <p className="font-medium">Vues par jour</p>
                      <p className="text-xs text-muted-foreground">
                        Max : {maxRecentViews}
                      </p>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-auto pr-1">
                      {recentViews.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucune donnée disponible.
                        </p>
                      ) : (
                        recentViews.map((item: { day: string; count: number }) => (
                          <div key={`view-${item.day}`} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                {formatShortDay(item.day)}
                              </span>
                              <span className="font-medium">{item.count}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full bg-blue-500 transition-all"
                                style={{
                                  width: `${Math.max(
                                    item.count > 0 ? 4 : 0,
                                    (item.count / maxRecentViews) * 100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
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
<div className="mt-2 flex justify-end">
  <Badge
    variant={getConversionBadgeVariant(
      getConversionRateValue(
        Number(resource.downloadCount ?? 0),
        Number(resource.viewCount ?? 0)
      )
    )}
    className="px-2 py-1 text-xs font-semibold"
  >
    {getConversionDisplayText(
      Number(resource.downloadCount ?? 0),
      Number(resource.viewCount ?? 0)
    )}
  </Badge>
</div>
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
                          <div className="mt-2 flex justify-end">
  <Badge
    variant={getConversionBadgeVariant(
      getConversionRateValue(
        Number(resource.downloadCount ?? 0),
        Number(resource.viewCount ?? 0)
      )
    )}
    className="px-2 py-1 text-xs font-semibold"
  >
    {getConversionDisplayText(
      Number(resource.downloadCount ?? 0),
      Number(resource.viewCount ?? 0)
    )}
  </Badge>
</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ressources jamais vues</CardTitle>
                <CardDescription>
                  Ressources encore invisibles dans le parcours utilisateur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {neverViewed.length === 0 ? (
                    <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                      Toutes les ressources ont déjà été consultées au moins une fois.
                    </div>
                  ) : (
                    neverViewed.map((resource: any) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">{resource.title}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">
                              {formatAccessLevel(resource.accessLevel)}
                            </Badge>
                            <Badge variant="outline">
                              {formatStatus(resource.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold">{resource.viewCount}</p>
                          <p className="text-sm text-muted-foreground">vue</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ressources jamais téléchargées</CardTitle>
                <CardDescription>
                  Ressources consultables mais jamais encore téléchargées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {neverDownloaded.length === 0 ? (
                    <div className="p-4 border rounded-lg text-sm text-muted-foreground">
                      Toutes les ressources ont déjà été téléchargées au moins une fois.
                    </div>
                  ) : (
                    neverDownloaded.map((resource: any) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">{resource.title}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Badge variant="secondary">
                              {formatAccessLevel(resource.accessLevel)}
                            </Badge>
                            <Badge variant="outline">
                              {formatStatus(resource.status)}
                            </Badge>
                          </div>
                        </div>

                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold">{resource.viewCount}</p>
                          <p className="text-sm text-muted-foreground">vues avant téléchargement</p>
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