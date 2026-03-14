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
  Trash2,
  Upload,
  Mail,
  Settings,
  Shield,
  BarChart3,
  Star,
} from "lucide-react";
import { Link, Redirect } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

// =========================================================
// Dashboard Admin — visibilité des modules
// (on masque ce qui n’est pas prioritaire pour l’instant)
// =========================================================

const SHOW_COLLECTIONS = false;
const SHOW_ASSIGN_CATEGORIES = false;
const SHOW_ACCESS_LEVELS = false;
const SHOW_SUBSCRIPTION_STATS = false;
const SHOW_STATS_SOON = false;

function AssignCategoriesButton() {
  const [isLoading, setIsLoading] = useState(false);

  const mutation = trpc.admin.assignCategories.useMutation({
    onSuccess: (result) => {
      const message = `Catégories assignées!\n\nMises à jour: ${result.updated}\nIgnorées: ${result.skipped}\nTotal: ${result.total}`;
      alert(message);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || String(error);
      alert(`Erreur: ${errorMessage}`);
    },
  });

  const handleAssignCategories = () => {
    setIsLoading(true);
    mutation.mutate(undefined, {
      onSettled: () => setIsLoading(false),
    });
  };

  return (
    <Button
      onClick={handleAssignCategories}
      disabled={isLoading || mutation.isPending}
      className="w-full"
    >
      {isLoading || mutation.isPending
        ? "Assignation en cours..."
        : "Assigner les catégories"}
    </Button>
  );
}

export default function Admin() {
  const { user, loading } = useAuth();

  const { data: resources = [] } = trpc.resources.list.useQuery({});

  // ⚠️ "themes" = thématiques (ancien système)
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

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Administration</h1>
            <p className="text-lg text-muted-foreground">
              Tableau de bord “propre” : uniquement les outils utiles maintenant.
            </p>
          </div>

          {/* Statistiques (simples) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ressources</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground">ressources publiées</p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Thématiques</CardTitle>
                <Tag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{themes.length}</div>
                <p className="text-xs text-muted-foreground">
                  thématiques (ancien système)
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Utilisateurs·rices
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">comptes enregistrés</p>
              </CardContent>
            </Card>
          </div>

          {/* Modules d'administration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Ressources */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Ressources</CardTitle>
                    <CardDescription>
                      Vue d’ensemble + modifications en masse
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
  <div className="grid gap-2">
    {/* Bleu = consulter / piloter */}
    <Button
      asChild
      className="w-full bg-blue-600 hover:bg-blue-700"
    >
      <Link href="/admin/resources-management">
        Ouvrir la vue d’ensemble
      </Link>
    </Button>

    {/* Orange = modifier en masse */}
    <Button
      asChild
      className="w-full bg-orange-600 hover:bg-orange-700"
    >
      <Link href="/admin/access-levels">
        Ouvrir les modifications en masse
      </Link>
    </Button>

    {/* Mini légende explicative */}
    <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
      <div>🔵 <span className="font-medium">Vue d’ensemble</span> : consulter et modifier une ressource individuellement.</div>
      <div>🟠 <span className="font-medium">Modifications en masse</span> : appliquer des changements à plusieurs ressources.</div>
    </div>
  </div>
</CardContent>

            </Card>

            {/* Catégories (Taxonomie) */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-emerald-700" />
                  </div>
                  <div>
                    <CardTitle>Gestion des catégories (Taxonomie)</CardTitle>
                    <CardDescription>
                      Catégories par profil (nouveau système)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Link href="/admin/categories">Gérer les catégories</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Thématiques (ancien système) */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-indigo-700" />
                  </div>
                  <div>
                    <CardTitle>Gestion des thématiques</CardTitle>
                    <CardDescription>
                      Ancien système (conservé séparément)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  <Link href="/admin/thematiques">Gérer les thématiques</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Utilisateurs */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-700" />
                  </div>
                  <div>
                    <CardTitle>Gestion des utilisateurs·rices</CardTitle>
                    <CardDescription>
                      Attribuer les rôles et gérer les accès
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Link href="/admin/utilisateurs">Gérer les utilisateurs·rices</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Profils */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-sky-700" />
                  </div>
                  <div>
                    <CardTitle>Gestion des profils</CardTitle>
                    <CardDescription>
                      Paramétrer les profils (animateur, directeur, etc.)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-sky-600 hover:bg-sky-700"
                >
                  <Link href="/admin/profils">Gérer les profils</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Import formateurs */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-cyan-700" />
                  </div>
                  <div>
                    <CardTitle>Import Excel des formateurs</CardTitle>
                    <CardDescription>
                      Importer des formateurs via Excel
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-cyan-600 hover:bg-cyan-700"
                >
                  <Link href="/admin/import-formateurs">Importer les formateurs</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Import ZIP (Option B) */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <CardTitle>Import ZIP (Option B)</CardTitle>
                    <CardDescription>
                      Importer un ZIP depuis ton ordinateur (audit / preview / import)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-amber-600 hover:bg-amber-700"
                >
                  <Link href="/admin/import-zip">Ouvrir l’import ZIP</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Emails formateurs */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-fuchsia-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-fuchsia-700" />
                  </div>
                  <div>
                    <CardTitle>Emails aux formateurs</CardTitle>
                    <CardDescription>
                      Envoyer les emails d’activation après import
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-fuchsia-600 hover:bg-fuchsia-700"
                >
                  <Link href="/admin/send-formateurs-emails">Envoyer les emails</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-rose-100 flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-rose-700" />
                  </div>
                  <div>
                    <CardTitle>Analytics</CardTitle>
                    <CardDescription>
                      Consulter les indicateurs réels de la plateforme
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-rose-600 hover:bg-rose-700"
                >
                  <Link href="/admin/analytics">Ouvrir Analytics</Link>
                </Button>
              </CardContent>
            </Card>

            {/* ifac à la une */}
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Star className="h-6 w-6 text-yellow-700" />
                  </div>
                  <div>
                    <CardTitle>ifac à la une</CardTitle>
                    <CardDescription>
                      Piloter les ressources mises en avant sur la page d’accueil
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-black"
                >
                  <Link href="/admin/ifac-a-la-une">Gérer la mise en avant</Link>
                </Button>
              </CardContent>
            </Card>

            {/* --- Modules non prioritaires (masqués par défaut) --- */}
            {SHOW_ASSIGN_CATEGORIES && (
              <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Tag className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Assigner les catégories</CardTitle>
                      <CardDescription>
                        Outil avancé : associer automatiquement des catégories aux
                        ressources
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <AssignCategoriesButton />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
