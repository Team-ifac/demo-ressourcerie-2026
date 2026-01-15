import { useState } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Plus, MessageCircle, Eye, Reply, Trash2, AlertCircle, Loader, Search, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export default function Forum() {
  const { user } = useAuth();
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicContent, setNewTopicContent] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const categories = [
    { id: "general", label: "Général", icon: "💬", color: "bg-blue-100 text-blue-700" },
    { id: "tips", label: "Astuces & Conseils", icon: "💡", color: "bg-yellow-100 text-yellow-700" },
    { id: "help", label: "Demande d'aide", icon: "🆘", color: "bg-red-100 text-red-700" },
    { id: "resources", label: "À propos des ressources", icon: "📚", color: "bg-green-100 text-green-700" },
    { id: "feedback", label: "Retours & Suggestions", icon: "📝", color: "bg-purple-100 text-purple-700" },
  ];

  // Mock data pour les sujets du forum
  const forumTopics = [
    {
      id: 1,
      title: "Comment adapter les activités pour les enfants en situation de handicap ?",
      category: "help",
      author: "Marie Dupont",
      views: 234,
      replies: 12,
      lastReply: new Date(Date.now() - 2 * 60 * 60 * 1000),
      solved: false,
    },
    {
      id: 2,
      title: "Astuces pour gérer un groupe de 30 enfants",
      category: "tips",
      author: "Jean Martin",
      views: 456,
      replies: 23,
      lastReply: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      solved: true,
    },
    {
      id: 3,
      title: "Nouvelle ressource : Jeu des 5 sens",
      category: "resources",
      author: "Admin IFAC",
      views: 789,
      replies: 45,
      lastReply: new Date(Date.now() - 3 * 60 * 60 * 1000),
      solved: false,
    },
    {
      id: 4,
      title: "Suggestion : Ajouter des filtres par niveau de difficulté",
      category: "feedback",
      author: "Sophie Bernard",
      views: 123,
      replies: 8,
      lastReply: new Date(Date.now() - 5 * 60 * 60 * 1000),
      solved: false,
    },
    {
      id: 5,
      title: "Où trouver des ressources pour les adolescents ?",
      category: "general",
      author: "Thomas Leclerc",
      views: 345,
      replies: 15,
      lastReply: new Date(Date.now() - 12 * 60 * 60 * 1000),
      solved: true,
    },
  ];

  const filteredTopics = forumTopics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryInfo = (categoryId: string) => {
    return categories.find((c) => c.id === categoryId);
  };

  const handleCreateTopic = async () => {
    if (!newTopicTitle.trim() || !newTopicContent.trim() || !user) return;

    setIsCreating(true);
    try {
      // Appel API pour créer le sujet (à implémenter)
      // await createTopicMutation.mutateAsync({...})
      
      setNewTopicTitle("");
      setNewTopicContent("");
      setNewTopicCategory("general");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Breadcrumb items={[{ label: "Forum" }]} />
            <div className="mt-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Authentification requise</h1>
              <p className="text-muted-foreground mb-6">
                Vous devez être connecté pour participer au forum.
              </p>
              <Button>Se connecter</Button>
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
          <Breadcrumb items={[{ label: "Forum d'entraide" }]} />

          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">Forum d'entraide</h1>
              <p className="text-lg text-muted-foreground">
                Posez vos questions, partagez vos astuces et connectez-vous avec la communauté
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau sujet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau sujet</DialogTitle>
                  <DialogDescription>
                    Posez votre question ou partagez vos idées avec la communauté
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Titre du sujet *
                    </label>
                    <Input
                      placeholder="Ex: Comment adapter les activités pour les enfants ?"
                      value={newTopicTitle}
                      onChange={(e) => setNewTopicTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Catégorie *
                    </label>
                    <select
                      value={newTopicCategory}
                      onChange={(e) => setNewTopicCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Votre message *
                    </label>
                    <Textarea
                      placeholder="Décrivez votre question ou votre idée en détail..."
                      value={newTopicContent}
                      onChange={(e) => setNewTopicContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <Button
                    onClick={handleCreateTopic}
                    disabled={isCreating || !newTopicTitle.trim() || !newTopicContent.trim()}
                    className="w-full"
                  >
                    {isCreating ? (
                      <>
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                        Création en cours...
                      </>
                    ) : (
                      "Créer le sujet"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Catégories */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {categories.map((cat) => (
              <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <p className="text-xs font-medium">{cat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher dans le forum..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Sujets du forum */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sujets populaires ({filteredTopics.length})
            </h2>

            {filteredTopics.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">Aucun sujet trouvé</p>
                </CardContent>
              </Card>
            ) : (
              filteredTopics.map((topic) => {
                const categoryInfo = getCategoryInfo(topic.category);
                return (
                  <Card
                    key={topic.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg line-clamp-1">
                              {topic.title}
                            </h3>
                            {topic.solved && (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                ✓ Résolu
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>{topic.author}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(topic.lastReply, {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Eye className="h-4 w-4" />
                              {topic.views}
                            </div>
                            <p className="text-xs text-muted-foreground">vues</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <Reply className="h-4 w-4" />
                              {topic.replies}
                            </div>
                            <p className="text-xs text-muted-foreground">réponses</p>
                          </div>
                          {categoryInfo && (
                            <Badge className={categoryInfo.color}>
                              {categoryInfo.icon}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
