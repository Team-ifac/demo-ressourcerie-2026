import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Tag, BarChart3, Folder, Shield, Lock, Trash2, TrendingUp, Upload, Mail, Settings } from "lucide-react";
import { Link, Redirect } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

function AssignCategoriesButton() {
  const [isLoading, setIsLoading] = useState(false);
  const mutation = trpc.admin.assignCategories.useMutation({
    onSuccess: (result) => {
      console.log('✅ Succès:', result);
      const message = `Catégories assignées!\n\nMises à jour: ${result.updated}\nIgnorées: ${result.skipped}\nTotal: ${result.total}`;
      console.log(message);
      alert(message);
    },
    onError: (error: any) => {
      console.error('❌ Erreur:', error);
      const errorMessage = error?.message || String(error);
      alert(`Erreur: ${errorMessage}`);
    },
  });

  const handleAssignCategories = () => {
    setIsLoading(true);
    console.log('🚀 Début de l\'assignation des catégories...');
    mutation.mutate(undefined, {
      onSettled: () => {
        setIsLoading(false);
      },
    });
  };

  return (
    <Button onClick={handleAssignCategories} disabled={isLoading || mutation.isPending} className="w-full">
      {isLoading || mutation.isPending ? "Assignation en cours..." : "Assigner les catégories"}
    </Button>
  );
}


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

          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Administration</h1>
            <p className="text-lg text-muted-foreground">
              Gérez les ressources, les thématiques et les utilisateurs·rices de la plateforme.
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ressources</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-muted-foreground">
                  ressources publiées
                </p>
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
                  thématiques actives
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Utilisateurs·rices</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
                <p className="text-xs text-muted-foreground">
                  comptes enregistrés
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Modules d'administration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Gestion des ressources</CardTitle>
                    <CardDescription>
                      Créer, modifier et supprimer des ressources pédagogiques
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <Link href="/admin/ressources">Gérer les ressources</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/admin/ressources/nouvelle">Nouvelle ressource</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <CardTitle>Gestion des ressources (en masse)</CardTitle>
                    <CardDescription>
                      Ajouter, modifier et supprimer plusieurs ressources a la fois
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/resources-management">Gerer les ressources</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-secondary-foreground" />
                  </div>
                  <div>
                    <CardTitle>Gestion des thématiques</CardTitle>
                    <CardDescription>
                      Organiser et structurer les catégories de ressources
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/thematiques">Gérer les thématiques</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-accent-foreground" />
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
                <Button asChild className="w-full">
                  <Link href="/admin/utilisateurs">Gérer les utilisateurs·rices</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Folder className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Gestion des collections</CardTitle>
                    <CardDescription>
                      Créer et gérer les collections thématiques
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/collections">Gérer les collections</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle>Associer aux collections</CardTitle>
                    <CardDescription>
                      Associer les ressources aux collections thématiques
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/collection-association">Associer les ressources</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Assigner les catégories</CardTitle>
                    <CardDescription>
                      Assigner automatiquement les catégories à toutes les ressources
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <AssignCategoriesButton />
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle>Gestion des profils</CardTitle>
                    <CardDescription>
                      Associer les ressources et collections aux profils utilisateurs
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/profils">Gérer les profils</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <CardTitle>Niveaux d'accès</CardTitle>
                    <CardDescription>
                      Gérer l'accès aux ressources (Public, Authentifié, Premium)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/access-levels">Gérer les niveaux d'accès</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Statistiques d'adhésion</CardTitle>
                    <CardDescription>
                      Consulter les données d'adhésion et les revenus
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/subscription-dashboard">Voir les statistiques</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-cyan-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle>Import Excel des formateurs</CardTitle>
                    <CardDescription>
                      Importer les formateurs via fichier Excel avec activation par email
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/import-formateurs">Importer les formateurs</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Envoyer les emails aux formateurs</CardTitle>
                    <CardDescription>
                      Envoyer les emails d'activation aux formateurs importés
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/send-formateurs-emails">Envoyer les emails</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300 border-muted">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Gestion du CMS</CardTitle>
                    <CardDescription>
                      Modifiez le contenu de vos pages sans toucher au code
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href="/admin/cms">Gérer le CMS</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-elegant hover:shadow-elegant-lg transition-all duration-300 border-muted">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <CardTitle>Statistiques</CardTitle>
                    <CardDescription>
                      Consulter les données d'utilisation de la plateforme
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full" disabled>
                  Prochainement disponible
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
