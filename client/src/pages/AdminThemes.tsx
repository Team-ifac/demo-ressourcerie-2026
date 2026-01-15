import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import { toast } from "sonner";

export default function AdminThemes() {
  const { user, loading } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const utils = trpc.useUtils();
  const { data: themes = [], isLoading } = trpc.themes.list.useQuery();

  const createMutation = trpc.themes.create.useMutation({
    onSuccess: () => {
      utils.themes.list.invalidate();
      toast.success("Thématique créée");
      closeDialog();
    },
  });

  const updateMutation = trpc.themes.update.useMutation({
    onSuccess: () => {
      utils.themes.list.invalidate();
      toast.success("Thématique mise à jour");
      closeDialog();
    },
  });

  const deleteMutation = trpc.themes.delete.useMutation({
    onSuccess: () => {
      utils.themes.list.invalidate();
      toast.success("Thématique supprimée");
    },
  });

  const openDialog = (theme?: { id: number; name: string; slug: string }) => {
    if (theme) {
      setEditingId(theme.id);
      setName(theme.name);
      setSlug(theme.slug);
    } else {
      setEditingId(null);
      setName("");
      setSlug("");
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setName("");
    setSlug("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !slug) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, name, slug });
    } else {
      createMutation.mutate({ name, slug });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr·e de vouloir supprimer cette thématique ?")) {
      deleteMutation.mutate({ id });
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
        <div className="container max-w-4xl space-y-8">
          <Breadcrumb 
            items={[
              { label: "Administration", href: "/admin" },
              { label: "Gestion des thématiques" }
            ]} 
          />

          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold">Gestion des thématiques</h1>
              <p className="text-muted-foreground mt-2">
                {themes.length} thématique{themes.length > 1 ? 's' : ''} au total
              </p>
            </div>
            <Button onClick={() => openDialog()} className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle thématique
            </Button>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Liste des thématiques</CardTitle>
              <CardDescription>
                Organisez les catégories de ressources
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : themes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Aucune thématique créée
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {themes.map((theme) => (
                        <TableRow key={theme.id}>
                          <TableCell className="font-medium">{theme.name}</TableCell>
                          <TableCell className="text-muted-foreground">{theme.slug}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openDialog(theme)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                onClick={() => handleDelete(theme.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Modifier la thématique" : "Nouvelle thématique"}
              </DialogTitle>
              <DialogDescription>
                Renseignez le nom et le slug de la thématique
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Jeux sportifs"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="Ex: jeux-sportifs"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
