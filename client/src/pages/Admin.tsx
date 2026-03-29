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
  BookOpen,
  Users,
  Tag,
  Upload,
  Mail,
  Shield,
  BarChart3,
  LayoutDashboard,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { trpc } from "@/lib/trpc";

export default function Admin() {
  const { user, loading } = useAuth();

  const { data: resources = [] } = trpc.resources.list.useQuery({});
  const { data: themes = [] } = trpc.themes.list.useQuery();

  const { data: users = [] } = trpc.admin.users.list.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

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
          <Breadcrumb items={[{ label: "Administration" }]} />

          <section className="rounded-3xl border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  Dashboard administrateur
                </div>

                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">Administration</h1>
                  <p className="text-lg text-muted-foreground">
                    Point d’entrée principal pour piloter la ressourcerie ifac :
                    ressources, catégories, utilisateurs, imports et indicateurs.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full border bg-blue-50 px-3 py-1 font-medium text-blue-700">
                    Pilotage éditorial
                  </span>
                  <span className="rounded-full border bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                    Gestion des accès
                  </span>
                  <span className="rounded-full border bg-orange-50 px-3 py-1 font-medium text-orange-700">
                    Import & structuration
                  </span>
                  <span className="rounded-full border bg-rose-50 px-3 py-1 font-medium text-rose-700">
                    Analytics
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 xl:w-[420px]">
                <Button asChild className="h-auto min-h-[52px] bg-blue-600 hover:bg-blue-700">
                  <Link href="/admin/resources-management">
                    Ouvrir la vue d’ensemble
                  </Link>
                </Button>

                <Button asChild className="h-auto min-h-[52px] bg-orange-600 hover:bg-orange-700">
                  <Link href="/admin/access-levels">
                    Modifications en masse
                  </Link>
                </Button>

                <Button asChild className="h-auto min-h-[52px] bg-amber-600 hover:bg-amber-700">
                  <Link href="/admin/import-zip">Import ZIP</Link>
                </Button>

                <Button asChild className="h-auto min-h-[52px] bg-rose-600 hover:bg-rose-700">
                  <Link href="/admin/analytics">Ouvrir Analytics</Link>
                </Button>
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ressources</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground">
                  ressources actuellement visibles dans le système
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Catégories / thématiques</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{themes.length}</div>
                <p className="text-xs text-muted-foreground">
                  référentiels actuellement disponibles
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs·rices</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  comptes enregistrés sur la plateforme
                </p>
              </CardContent>
            </Card>

          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Contenu</h2>
              <p className="text-sm text-muted-foreground">
                Les outils centraux pour gérer les ressources de la ressourcerie.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FolderKanban className="h-6 w-6 text-blue-700" />
                    </div>
                    <div>
                      <CardTitle>Vue d’ensemble des ressources</CardTitle>
                      <CardDescription>
                        Gérer une ressource à la fois
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                    <Link href="/admin/resources-management">
                      Ouvrir la vue d’ensemble
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Idéal pour consulter, modifier, supprimer, exporter la traçabilité
                    et contrôler l’historique d’une ressource précise.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-orange-700" />
                    </div>
                    <div>
                      <CardTitle>Modifications en masse</CardTitle>
                      <CardDescription>
                        Gérer plusieurs ressources en une fois
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-orange-600 hover:bg-orange-700">
                    <Link href="/admin/access-levels">
                      Ouvrir les modifications en masse
                    </Link>
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    À utiliser pour appliquer rapidement des changements collectifs
                    sans ouvrir chaque ressource individuellement.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <Tag className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <CardTitle>Gestion des catégories</CardTitle>
                      <CardDescription>
                        Structurer l’arborescence pédagogique
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                    <Link href="/admin/categories">Gérer les catégories</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Permet d’organiser les ressources selon la logique produit et la
                    structure pédagogique de la plateforme.
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300 md:col-span-3">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-amber-700" />
                    </div>
                    <div>
                      <CardTitle>Import ZIP (Option B)</CardTitle>
                      <CardDescription>
                        Importer un lot complet de ressources depuis ton ordinateur
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild className="w-full md:w-auto bg-amber-600 hover:bg-amber-700">
                    <Link href="/admin/import-zip">Ouvrir l’import ZIP</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    À utiliser pour intégrer rapidement des lots de documents avec leur
                    arborescence, leurs niveaux d’accès et leur logique d’import.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Utilisateurs et accès</h2>
              <p className="text-sm text-muted-foreground">
                Les outils pour piloter les comptes, les rôles et les profils.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Users className="h-6 w-6 text-purple-700" />
                    </div>
                    <div>
                      <CardTitle>Gestion des utilisateurs·rices</CardTitle>
                      <CardDescription>
                        Rôles, comptes et accès à la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-purple-600 hover:bg-purple-700">
                    <Link href="/admin/utilisateurs">Gérer les utilisateurs·rices</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                      <Shield className="h-6 w-6 text-sky-700" />
                    </div>
                    <div>
                      <CardTitle>Gestion des profils</CardTitle>
                      <CardDescription>
                        Profils métiers et arborescence pédagogique
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-sky-600 hover:bg-sky-700">
                    <Link href="/admin/categories">Gérer les profils</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold">Outils avancés</h2>
              <p className="text-sm text-muted-foreground">
                Outils utiles ponctuellement pour l’import, les emails et le suivi.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                      <Upload className="h-6 w-6 text-cyan-700" />
                    </div>
                    <div>
                      <CardTitle>Import Excel des formateurs</CardTitle>
                      <CardDescription>
                        Import en masse depuis Excel
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-cyan-600 hover:bg-cyan-700">
                    <Link href="/admin/import-formateurs">Importer les formateurs</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-fuchsia-100 flex items-center justify-center">
                      <Mail className="h-6 w-6 text-fuchsia-700" />
                    </div>
                    <div>
                      <CardTitle>Emails aux formateurs</CardTitle>
                      <CardDescription>
                        Envoi des emails d’activation
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-fuchsia-600 hover:bg-fuchsia-700">
                    <Link href="/admin/send-formateurs-emails">Envoyer les emails</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-rose-700" />
                    </div>
                    <div>
                      <CardTitle>Analytics</CardTitle>
                      <CardDescription>
                        Indicateurs réels de la plateforme
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-rose-600 hover:bg-rose-700">
                    <Link href="/admin/analytics">Ouvrir Analytics</Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Tag className="h-6 w-6 text-indigo-700" />
                    </div>
                    <div>
                      <CardTitle>Gestion des thématiques</CardTitle>
                      <CardDescription>
                        Ancien système conservé séparément
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700">
                    <Link href="/admin/thematiques">Gérer les thématiques</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}