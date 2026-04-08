import { useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Download,
  Eye,
  FolderKanban,
  LayoutDashboard,
  Mail,
  Shield,
  Sparkles,
  Tag,
  TrendingUp,
  Upload,
  Users,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { trpc } from "@/lib/trpc";

type StatItem = {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClassName: string;
  glowClassName: string;
};

type ActionItem = {
  title: string;
  description: string;
  cta: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  accentClassName: string;
  softClassName: string;
  buttonClassName: string;
  featured?: boolean;
};

function AdminSectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {eyebrow}
      </div>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();

  const { data: resources = [] } = trpc.resources.list.useQuery({});
  const { data: themes = [] } = trpc.themes.list.useQuery();

  const { data: users = [] } = trpc.admin.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const { data: platformStats } = trpc.admin.stats.getPlatformStats.useQuery(
    undefined,
    {
      enabled: user?.role === "admin",
    },
  );

  const stats = useMemo<StatItem[]>(
    () => [
      {
        title: "Ressources",
        value: resources.length,
        description: "Ressources actuellement visibles et pilotables dans le système.",
        icon: BookOpen,
        accentClassName:
          "text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-900/60",
        glowClassName:
          "from-blue-500/10 via-blue-500/5 to-transparent dark:from-blue-500/20 dark:via-blue-500/10",
      },
      {
        title: "Catégories / thématiques",
        value: themes.length,
        description:
          "Référentiels disponibles pour structurer l’arborescence pédagogique.",
        icon: Tag,
        accentClassName:
          "text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/60",
        glowClassName:
          "from-emerald-500/10 via-emerald-500/5 to-transparent dark:from-emerald-500/20 dark:via-emerald-500/10",
      },
      {
        title: "Utilisateurs·rices",
        value: users.length,
        description:
          "Comptes enregistrés et potentiellement concernés par les droits d’accès.",
        icon: Users,
        accentClassName:
          "text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-900/60",
        glowClassName:
          "from-violet-500/10 via-violet-500/5 to-transparent dark:from-violet-500/20 dark:via-violet-500/10",
      },
    ],
    [resources.length, themes.length, users.length],
  );

  const coreActions: ActionItem[] = [
    {
      title: "Vue d’ensemble des ressources",
      description:
        "Consulter, modifier, supprimer, exporter la traçabilité et contrôler l’historique d’une ressource précise.",
      cta: "Ouvrir la vue d’ensemble",
      href: "/admin/resources-management",
      icon: FolderKanban,
      tag: "Pilotage éditorial",
      accentClassName: "text-blue-700 dark:text-blue-300",
      softClassName:
        "bg-blue-100/80 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/60",
      buttonClassName: "bg-blue-600 hover:bg-blue-700",
      featured: true,
    },
    {
      title: "Modifications en masse",
      description:
        "Appliquer rapidement des changements collectifs sur plusieurs ressources sans ouvrir chaque fiche individuellement.",
      cta: "Ouvrir les modifications en masse",
      href: "/admin/access-levels",
      icon: Sparkles,
      tag: "Productivité",
      accentClassName: "text-orange-700 dark:text-orange-300",
      softClassName:
        "bg-orange-100/80 dark:bg-orange-950/40 border-orange-200/60 dark:border-orange-900/60",
      buttonClassName: "bg-orange-600 hover:bg-orange-700",
      featured: true,
    },
    {
      title: "Gestion des catégories",
      description:
        "Structurer l’arborescence pédagogique et organiser les ressources selon la logique produit de la plateforme.",
      cta: "Gérer les catégories",
      href: "/admin/categories",
      icon: Tag,
      tag: "Structuration",
      accentClassName: "text-emerald-700 dark:text-emerald-300",
      softClassName:
        "bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/60",
      buttonClassName: "bg-emerald-600 hover:bg-emerald-700",
      featured: true,
    },
    {
      title: "Import ZIP (Option B)",
      description:
        "Importer des lots complets de ressources avec leur arborescence, leurs niveaux d’accès et leur logique d’import.",
      cta: "Ouvrir l’import ZIP",
      href: "/admin/import-zip",
      icon: Upload,
      tag: "Import & structuration",
      accentClassName: "text-amber-700 dark:text-amber-300",
      softClassName:
        "bg-amber-100/80 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-900/60",
      buttonClassName: "bg-amber-600 hover:bg-amber-700",
    },
  ];

  const accessActions: ActionItem[] = [
    {
      title: "Gestion des utilisateurs·rices",
      description: "Rôles, comptes et accès à la plateforme.",
      cta: "Gérer les utilisateurs·rices",
      href: "/admin/utilisateurs",
      icon: Users,
      tag: "Comptes",
      accentClassName: "text-violet-700 dark:text-violet-300",
      softClassName:
        "bg-violet-100/80 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-900/60",
      buttonClassName: "bg-violet-600 hover:bg-violet-700",
    },
    {
      title: "Gestion des profils",
      description: "Profils métiers et arborescence pédagogique.",
      cta: "Gérer les profils",
      href: "/admin/categories",
      icon: Shield,
      tag: "Accès",
      accentClassName: "text-sky-700 dark:text-sky-300",
      softClassName:
        "bg-sky-100/80 dark:bg-sky-950/40 border-sky-200/60 dark:border-sky-900/60",
      buttonClassName: "bg-sky-600 hover:bg-sky-700",
    },
  ];

  const totalViews = platformStats?.counters?.totalViews ?? 0;
  const totalDownloads = platformStats?.counters?.totalDownloads ?? 0;

  const totalResources = platformStats?.counters?.totalResources ?? 0;
  const publishedResources = platformStats?.counters?.publishedResources ?? 0;

  const engagementRatio =
    totalViews > 0 ? Math.round((totalDownloads / totalViews) * 100) : 0;

  const publicationRate =
    totalResources > 0
      ? Math.round((publishedResources / totalResources) * 100)
      : 0;

  const averageViewsPerResource =
    totalResources > 0 ? totalViews / totalResources : 0;

  const averageDownloadsPerResource =
    totalResources > 0 ? totalDownloads / totalResources : 0;

  const activityLevel =
    totalViews > 1000
      ? "Très forte activité"
      : totalViews > 300
        ? "Activité soutenue"
        : totalViews > 100
          ? "Activité modérée"
          : "Activité faible";

  const activityCards = [
    {
      title: "Vues totales",
      value: totalViews.toLocaleString("fr-FR"),
      description: "consultations enregistrées sur la plateforme",
      icon: Eye,
      accentClassName:
        "text-blue-700 dark:text-blue-300 border-blue-200/70 dark:border-blue-900/60",
      softClassName:
        "bg-blue-100/80 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-900/60",
    },
    {
      title: "Téléchargements",
      value: totalDownloads.toLocaleString("fr-FR"),
      description: "téléchargements réellement effectués",
      icon: Download,
      accentClassName:
        "text-emerald-700 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-900/60",
      softClassName:
        "bg-emerald-100/80 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-900/60",
    },
    {
      title: "Engagement",
      value: `${engagementRatio}%`,
      description: "ratio téléchargements / vues",
      icon: TrendingUp,
      accentClassName:
        "text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-900/60",
      softClassName:
        "bg-violet-100/80 dark:bg-violet-950/40 border-violet-200/60 dark:border-violet-900/60",
    },
    {
      title: "Publication",
      value: `${publicationRate}%`,
      description: "part des ressources publiées",
      icon: Activity,
      accentClassName:
        "text-rose-700 dark:text-rose-300 border-rose-200/70 dark:border-rose-900/60",
      softClassName:
        "bg-rose-100/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60",
    },
  ];

  const advancedActions: ActionItem[] = [
    {
      title: "Import Excel des formateurs",
      description: "Import en masse depuis Excel.",
      cta: "Importer les formateurs",
      href: "/admin/import-formateurs",
      icon: Upload,
      tag: "Import",
      accentClassName: "text-cyan-700 dark:text-cyan-300",
      softClassName:
        "bg-cyan-100/80 dark:bg-cyan-950/40 border-cyan-200/60 dark:border-cyan-900/60",
      buttonClassName: "bg-cyan-600 hover:bg-cyan-700",
    },
    {
      title: "Emails aux formateurs",
      description: "Envoi des emails d’activation.",
      cta: "Envoyer les emails",
      href: "/admin/send-formateurs-emails",
      icon: Mail,
      tag: "Communication",
      accentClassName: "text-fuchsia-700 dark:text-fuchsia-300",
      softClassName:
        "bg-fuchsia-100/80 dark:bg-fuchsia-950/40 dark:border-fuchsia-900/60 border-fuchsia-200/60",
      buttonClassName: "bg-fuchsia-600 hover:bg-fuchsia-700",
    },
    {
      title: "Analytics",
      description: "Indicateurs réels de la plateforme.",
      cta: "Ouvrir Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      tag: "Suivi",
      accentClassName: "text-rose-700 dark:text-rose-300",
      softClassName:
        "bg-rose-100/80 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60",
      buttonClassName: "bg-rose-600 hover:bg-rose-700",
    },
    {
      title: "Gestion des thématiques",
      description: "Ancien système conservé séparément.",
      cta: "Gérer les thématiques",
      href: "/admin/thematiques",
      icon: Tag,
      tag: "Legacy",
      accentClassName: "text-indigo-700 dark:text-indigo-300",
      softClassName:
        "bg-indigo-100/80 dark:bg-indigo-950/40 border-indigo-200/60 dark:border-indigo-900/60",
      buttonClassName: "bg-indigo-600 hover:bg-indigo-700",
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">

        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,rgba(248,250,252,0.95),rgba(255,255,255,1))] dark:bg-background">
      <main className="pb-14 pt-8">
        <div className="container space-y-10">
          <Breadcrumb items={[{ label: "Administration" }]} />

          <section className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.16),transparent_30%),radial-gradient(circle_at_top_right,rgba(244,114,182,0.12),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.12),transparent_24%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.22),transparent_32%),radial-gradient(circle_at_top_right,rgba(244,114,182,0.18),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.16),transparent_28%)]" />

            <div className="relative grid gap-8 p-6 md:p-8 xl:grid-cols-[minmax(0,1fr)_430px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
              <div className="space-y-6">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard administrateur
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
                    Administration
                  </h1>
                  <p className="max-w-3xl text-sm leading-7 text-muted-foreground md:text-base">
                    Point d’entrée principal pour piloter la ressourcerie ifac :
                    ressources, catégories, utilisateurs, imports et indicateurs.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                    Pilotage éditorial
                  </span>
                  <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
                    Gestion des accès
                  </span>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
                    Import & structuration
                  </span>
                  <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
                    Analytics
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-4 pt-1 md:grid-cols-3">
                  {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                      <div
                        key={stat.title}
                        className={`relative overflow-hidden rounded-2xl border bg-background/90 p-5 shadow-sm backdrop-blur ${stat.accentClassName}`}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br ${stat.glowClassName}`}
                        />
                        <div className="relative space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                {stat.title}
                              </p>
                              <div className="text-4xl font-semibold tracking-tight text-foreground">
                                {stat.value}
                              </div>
                            </div>

                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-current/15 bg-background/80">
                              <Icon className="h-5 w-5" />
                            </div>
                          </div>

                          <p className="text-xs leading-5 text-muted-foreground">
                            {stat.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <Card className="border-border/70 bg-background/88 shadow-sm backdrop-blur">
                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Accès rapides</CardTitle>
                      <CardDescription>
                        Les entrées les plus utiles pour piloter la plateforme.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/35 p-3">
                    <p className="text-xs leading-5 text-muted-foreground">
                      Utilise ce bloc pour accéder immédiatement aux 4 zones les plus
                      consultées de l’administration.
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-3">
                  <Button
                    asChild
                    className="h-12 justify-between rounded-xl bg-blue-600 px-4 hover:bg-blue-700"
                  >
                    <Link href="/admin/resources-management">
                      <span>Vue d’ensemble des ressources</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="h-12 justify-between rounded-xl bg-orange-600 px-4 hover:bg-orange-700"
                  >
                    <Link href="/admin/access-levels">
                      <span>Modifications en masse</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="h-12 justify-between rounded-xl bg-amber-600 px-4 hover:bg-amber-700"
                  >
                    <Link href="/admin/import-zip">
                      <span>Import ZIP (Option B)</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Button
                    asChild
                    className="h-12 justify-between rounded-xl bg-rose-600 px-4 hover:bg-rose-700"
                  >
                    <Link href="/admin/analytics">
                      <span>Analytics</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-5 rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-sm md:p-8">
            <AdminSectionHeader
              eyebrow="Lecture d’ensemble"
              title="Activité plateforme"
              description="Un premier niveau de lecture pour suivre rapidement l’usage global de la ressourcerie ifac avant d’entrer dans les outils d’administration."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <Card className="overflow-hidden border-blue-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(255,255,255,0.98))] shadow-[0_18px_50px_rgba(59,130,246,0.12)] xl:col-span-5 dark:border-blue-900/60 dark:bg-[linear-gradient(135deg,rgba(30,41,59,0.96),rgba(15,23,42,0.98))]">
                <CardHeader className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-blue-200/60 bg-blue-100/80 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
                      <BarChart3 className="h-6 w-6" />
                    </div>

                    <div className="space-y-2">
                      <div className="inline-flex rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                        Niveau d’activité
                      </div>
                      <div className="flex items-center gap-3">
  <div
    className={`h-3 w-3 rounded-full ${
      activityLevel.includes("Très")
        ? "bg-green-500"
        : activityLevel.includes("soutenue")
          ? "bg-emerald-400"
          : activityLevel.includes("modérée")
            ? "bg-amber-400"
            : "bg-rose-400"
    }`}
  />

  <CardTitle className="text-2xl leading-8">
    {activityLevel}
  </CardTitle>
</div>
                      <CardDescription className="text-sm leading-6">
                        Cet indicateur synthétique donne une lecture immédiate du
                        dynamisme actuel de la plateforme.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="grid gap-4 pt-0 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Moyenne de vues
                    </p>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {averageViewsPerResource.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      vues en moyenne par ressource
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      Moyenne de téléchargements
                    </p>
                    <div className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                      {averageDownloadsPerResource.toLocaleString("fr-FR", {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 1,
                      })}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      téléchargements en moyenne par ressource
                    </p>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:col-span-7">
                {activityCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Card
                      key={item.title}
                      className={`overflow-hidden border-border/70 bg-background/95 shadow-sm ${item.accentClassName}`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                              {item.title}
                            </p>
                            <div className="text-4xl font-semibold tracking-tight text-foreground">
                              {item.value}
                            </div>
                            <p className="text-xs leading-5 text-muted-foreground">
                              {item.description}
                            </p>
                          </div>

                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${item.softClassName}`}
                          >
                            <Icon className={`h-5 w-5 ${item.accentClassName.split(" ")[0]}`} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="space-y-5 rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-sm md:p-8">
            <AdminSectionHeader
              eyebrow="Pilotage du contenu"
              title="Contenu"
              description="Les outils centraux pour gérer les ressources de la ressourcerie, avec une lecture plus claire entre pilotage éditorial, actions massives et structuration."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              {coreActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.title}
                    className={`group overflow-hidden border-border/70 bg-background/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
                      item.featured ? "xl:col-span-4" : "xl:col-span-12"
                    }`}
                  >
                    <CardHeader className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.softClassName}`}
                        >
                          <Icon className={`h-6 w-6 ${item.accentClassName}`} />
                        </div>

                        <div className="space-y-2">
                          <div className="inline-flex rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {item.tag}
                          </div>
                          <CardTitle className="text-xl leading-7">{item.title}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Button
                        asChild
                        className={`h-11 w-full rounded-xl ${item.buttonClassName}`}
                      >
                        <Link href={item.href}>
                          <span>{item.cta}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-5 rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-sm md:p-8">
            <AdminSectionHeader
              eyebrow="Comptes et droits"
              title="Utilisateurs et accès"
              description="Les outils pour piloter les comptes, les rôles et les profils métiers de la plateforme avec une séparation claire entre gestion des personnes et gestion des structures d’accès."
            />

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {accessActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.title}
                    className="group overflow-hidden border-border/70 bg-background/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardHeader className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.softClassName}`}
                        >
                          <Icon className={`h-6 w-6 ${item.accentClassName}`} />
                        </div>

                        <div className="space-y-2">
                          <div className="inline-flex rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {item.tag}
                          </div>
                          <CardTitle className="text-xl">{item.title}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Button
                        asChild
                        className={`h-11 w-full rounded-xl ${item.buttonClassName}`}
                      >
                        <Link href={item.href}>
                          <span>{item.cta}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-5 rounded-[28px] border border-border/70 bg-card/85 p-6 shadow-sm md:p-8">
            <AdminSectionHeader
              eyebrow="Opérations complémentaires"
              title="Outils avancés"
              description="Les outils utiles ponctuellement pour l’import, les emails, le suivi et les anciens modules conservés séparément."
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
              {advancedActions.map((item) => {
                const Icon = item.icon;

                return (
                  <Card
                    key={item.title}
                    className="group overflow-hidden border-border/70 bg-background/95 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CardHeader className="space-y-5">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${item.softClassName}`}
                        >
                          <Icon className={`h-6 w-6 ${item.accentClassName}`} />
                        </div>

                        <div className="space-y-2">
                          <div className="inline-flex rounded-full border border-border/70 bg-muted px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            {item.tag}
                          </div>
                          <CardTitle className="text-lg leading-6">{item.title}</CardTitle>
                          <CardDescription className="text-sm leading-6">
                            {item.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <Button
                        asChild
                        className={`h-11 w-full rounded-xl ${item.buttonClassName}`}
                      >
                        <Link href={item.href}>
                          <span>{item.cta}</span>
                          <ArrowRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}