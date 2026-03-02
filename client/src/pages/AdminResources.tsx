import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { Search, Plus, Edit, Trash2, Loader2, Globe, Lock, Users, Crown, FileText } from "lucide-react";
import { Link, Redirect } from "wouter";
import { toast } from "sonner";

type VisibilityValue = "PUBLIC" | "INTERNAL_IFAC" | string;
type AccessLevelValue = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM" | string;
type StatusValue = "draft" | "pending" | "approved" | "rejected" | string;

function visibilityLabel(v: any) {
  const s = String(v ?? "INTERNAL_IFAC").toUpperCase() as VisibilityValue;
  return s === "PUBLIC" ? "Visible sans connexion" : "Connexion requise";
}

function accessLabel(v: any) {
  const s = String(v ?? "PUBLIC").toUpperCase() as AccessLevelValue;
  if (s === "PREMIUM") return "Premium";
  if (s === "INTERNAL_IFAC") return "Connexion requise (ifac)";
  return "Public";
}

function normalizeStatus(v: any): "draft" | "pending" | "approved" | "rejected" {
  const s = String(v ?? "draft").toLowerCase();
  if (s === "pending") return "pending";
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  return "draft";
}

function statusLabel(v: any) {
  const s = normalizeStatus(v);
  if (s === "approved") return "Publiée";
  if (s === "pending") return "En attente";
  if (s === "rejected") return "Rejetée";
  return "Brouillon";
}

export default function AdminResources() {
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: resources = [], isLoading } = trpc.resources.list.useQuery({
    search: search || undefined,
  });

  const deleteMutation = trpc.resources.delete.useMutation({
    onSuccess: () => {
      utils.resources.list.invalidate();
      toast.success("Ressource supprimée avec succès");
      setDeleteId(null);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate({ id: deleteId });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
              { label: "Administration", href: "/admin" },
              { label: "Gestion des ressources" },
            ]}
          />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Gestion des ressources</h1>
              <p className="text-muted-foreground mt-2">
                {resources.length} ressource{resources.length > 1 ? "s" : ""} au total
              </p>
            </div>
            <Button asChild className="gap-2">
              <Link href="/admin/ressources/nouvelle">
                <Plus className="h-4 w-4" />
                Nouvelle ressource
              </Link>
            </Button>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Liste des ressources</CardTitle>
              <CardDescription>Recherchez, modifiez ou supprimez des ressources existantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par titre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : resources.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">Aucune ressource trouvée</div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Titre</TableHead>
                        <TableHead>Type</TableHead>

                        {/* ✅ On garde "Visibilité" (sans connexion vs connexion requise) */}
                        <TableHead>Visibilité</TableHead>

                        {/* ✅ AJOUT : Accès / Statut (comme l'admin en masse) */}
                        <TableHead>Accès</TableHead>
                        <TableHead>Statut</TableHead>

                        <TableHead>Tranche d'âge</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {resources.map((resource: any) => {
                        const vis = String(resource.visibility ?? "INTERNAL_IFAC").toUpperCase();
                        const acc = String(resource.accessLevel ?? "PUBLIC").toUpperCase();
                        const st = String(resource.status ?? "draft").toLowerCase();

                        return (
                          <TableRow key={resource.id}>
                            <TableCell className="font-medium max-w-xs">
                              <div className="truncate">{resource.title}</div>
                            </TableCell>

                            <TableCell>
                              {resource.type && <Badge variant="secondary">{resource.type}</Badge>}
                            </TableCell>

                            <TableCell>
                              <Badge variant={vis === "PUBLIC" ? "outline" : "secondary"} className="gap-1">
                                {vis === "PUBLIC" ? (
                                  <>
                                    <Globe className="h-3 w-3" />
                                    {visibilityLabel(vis)}
                                  </>
                                ) : (
                                  <>
                                    <Lock className="h-3 w-3" />
                                    {visibilityLabel(vis)}
                                  </>
                                )}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="gap-1">
                            {acc === "PREMIUM" ? (
                              <>
                                <Crown className="h-3 w-3" /> {accessLabel(acc)}
                              </>
                            ) : acc === "INTERNAL_IFAC" ? (
                              <>
                                <Users className="h-3 w-3" /> {accessLabel(acc)}
                              </>
                            ) : (
                              <>
                                <Globe className="h-3 w-3" /> {accessLabel(acc)}
                              </>
                            )}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              <Badge variant={st === "approved" ? "secondary" : "outline"} className="gap-1">
                                <FileText className="h-3 w-3" />
                                {statusLabel(st)}
                              </Badge>
                            </TableCell>

                            <TableCell>
                              {resource.ageRange && <Badge variant="outline">{resource.ageRange}</Badge>}
                            </TableCell>

                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                                  <Link href={`/admin/ressources/${resource.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={() => setDeleteId(resource.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr·e de vouloir supprimer cette ressource ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
