import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus, Trash2, Edit, Share2, Lock, Globe, AlertCircle, Loader } from "lucide-react";

export default function Collections() {
  const { user } = useAuth();
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: collections = [], isLoading } = trpc.collections.list.useQuery();
  const createMutation = trpc.collections.create.useMutation();
  const updateMutation = trpc.collections.update.useMutation();
  const deleteMutation = trpc.collections.delete.useMutation();
  const utils = trpc.useUtils();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Breadcrumb items={[{ label: "Mes collections" }]} />
            <div className="mt-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Authentification requise</h1>
              <p className="text-muted-foreground mb-6">
                Vous devez être connecté pour gérer vos collections.
              </p>
              <Button>Se connecter</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    setIsCreating(true);
    try {
      await createMutation.mutateAsync({
        name: newCollectionName,
        description: newCollectionDescription || undefined,
        isPublic,
      });

      setNewCollectionName("");
      setNewCollectionDescription("");
      setIsPublic(false);
      utils.collections.list.invalidate();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCollection = async (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette collection ?")) {
      try {
        await deleteMutation.mutateAsync({ id });
        utils.collections.list.invalidate();
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Mes collections" }]} />

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Mes collections</h1>
              <p className="text-lg text-muted-foreground">
                Organisez vos ressources favorites en collections personnalisées
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer une nouvelle collection</DialogTitle>
                  <DialogDescription>
                    Organisez vos ressources favorites dans une collection personnalisée
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Nom de la collection *
                    </label>
                    <Input
                      placeholder="Ex: Activités pour enfants"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Description
                    </label>
                    <Textarea
                      placeholder="Décrivez le contenu de cette collection"
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="public"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="public" className="text-sm font-medium cursor-pointer">
                      Rendre cette collection publique (partageable avec d'autres)
                    </label>
                  </div>
                  <Button
                    onClick={handleCreateCollection}
                    disabled={isCreating || !newCollectionName.trim()}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer la collection"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Collections */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : collections.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez pas encore créé de collection.
                </p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer votre première collection
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Créer une nouvelle collection</DialogTitle>
                      <DialogDescription>
                        Organisez vos ressources favorites dans une collection personnalisée
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Nom de la collection *
                        </label>
                        <Input
                          placeholder="Ex: Activités pour enfants"
                          value={newCollectionName}
                          onChange={(e) => setNewCollectionName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Description
                        </label>
                        <Textarea
                          placeholder="Décrivez le contenu de cette collection"
                          value={newCollectionDescription}
                          onChange={(e) => setNewCollectionDescription(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="public"
                          checked={isPublic}
                          onChange={(e) => setIsPublic(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="public" className="text-sm font-medium cursor-pointer">
                          Rendre cette collection publique
                        </label>
                      </div>
                      <Button
                        onClick={handleCreateCollection}
                        disabled={isCreating || !newCollectionName.trim()}
                        className="w-full"
                      >
                        {isCreating ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Création en cours...
                          </>
                        ) : (
                          "Créer la collection"
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {collections.map((collection) => (
                <Card key={collection.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                  {collection.imageUrl && (
                    <div className="relative h-40 bg-muted overflow-hidden">
                      <img
                        src={collection.imageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="line-clamp-2">{collection.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {collection.description || "Pas de description"}
                        </CardDescription>
                      </div>
                      {collection.isPublic === "true" ? (
                        <Globe className="h-5 w-5 text-blue-500 shrink-0" />
                      ) : (
                        <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Collection créée le {new Date(collection.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          // Naviguer vers la collection
                        }}
                      >
                        Voir
                      </Button>
                      {collection.isPublic === "true" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Copier le lien de partage
                            const url = `${window.location.origin}/collections/${collection.id}`;
                            navigator.clipboard.writeText(url);
                          }}
                        >
                          <Share2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingId(collection.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCollection(collection.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
