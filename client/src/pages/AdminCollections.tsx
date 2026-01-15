import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Edit2, Plus, AlertCircle, CheckCircle } from "lucide-react";

export function AdminCollections() {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const collectionsQuery = trpc.collections.adminList.useQuery();
  const createMutation = trpc.collections.adminCreate.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Collection créée avec succès' });
      collectionsQuery.refetch();
      resetForm();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const updateMutation = trpc.collections.adminUpdate.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Collection mise à jour avec succès' });
      collectionsQuery.refetch();
      resetForm();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const deleteMutation = trpc.collections.adminDelete.useMutation({
    onSuccess: () => {
      setMessage({ type: 'success', text: 'Collection supprimée avec succès' });
      collectionsQuery.refetch();
      setTimeout(() => setMessage(null), 3000);
    },
    onError: (error: any) => {
      setMessage({ type: 'error', text: error.message });
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setMessage({ type: 'error', text: 'Le nom de la collection est requis' });
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: formData.name,
        description: formData.description || undefined,
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        description: formData.description || undefined,
      });
    }
  };

  const handleEdit = (collection: any) => {
    setEditingId(collection.id);
    setFormData({
      name: collection.name,
      description: collection.description || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Êtes-vous sûr·e de vouloir supprimer cette collection ?")) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Collections</h1>
          <p className="text-gray-600 mt-2">Créez et gérez les collections thématiques de ressources</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()} className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle collection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Modifier la collection" : "Créer une collection"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifiez les détails de la collection" : "Créez une nouvelle collection thématique"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom de la collection *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Jeux collectifs"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez cette collection..."
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending} className="w-full">
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex gap-2 items-start ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid gap-4">
        {collectionsQuery.isLoading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Chargement des collections...</p>
            </CardContent>
          </Card>
        ) : collectionsQuery.data?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-600">Aucune collection créée. Commencez par en créer une !</p>
            </CardContent>
          </Card>
        ) : (
          collectionsQuery.data?.map((collection: any) => (
            <Card key={collection.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{collection.name}</CardTitle>
                    <CardDescription>{collection.description || "Pas de description"}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(collection)}
                      className="gap-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      Modifier
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(collection.id)}
                      className="gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  {collection.resourceCount || 0} ressource{(collection.resourceCount || 0) !== 1 ? "s" : ""} associée{(collection.resourceCount || 0) !== 1 ? "s" : ""}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
