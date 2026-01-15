import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserBadges } from "@/components/UserBadges";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, Mail, Calendar, MapPin, Trophy, BookOpen, MessageCircle, Heart } from "lucide-react";

export default function UserProfile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Breadcrumb items={[{ label: "Mon profil" }]} />
            <div className="mt-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Authentification requise</h1>
              <p className="text-muted-foreground mb-6">
                Vous devez être connecté pour accéder à votre profil.
              </p>
              <Button>Se connecter</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Mock stats
  const stats = {
    resourcesContributed: 3,
    commentsPosted: 12,
    resourcesTested: 25,
    collectionsCreated: 2,
    forumPostsCreated: 5,
  };

  // Mock recent activities
  const recentActivities = [
    {
      id: 1,
      type: "resource-tested",
      title: "A testé la ressource 'Jeu des 5 sens'",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      type: "comment-posted",
      title: "A commenté 'Activités pour enfants'",
      date: new Date(Date.now() - 5 * 60 * 60 * 1000),
    },
    {
      id: 3,
      type: "resource-contributed",
      title: "A soumis une nouvelle ressource 'Jeu de société'",
      date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 4,
      type: "collection-created",
      title: "A créé une collection 'Activités ludiques'",
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      id: 5,
      type: "forum-post",
      title: "A créé un sujet au forum 'Astuces pédagogiques'",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "resource-tested":
        return "✓";
      case "comment-posted":
        return "💬";
      case "resource-contributed":
        return "📤";
      case "collection-created":
        return "📚";
      case "forum-post":
        return "💡";
      default:
        return "•";
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Mon profil" }]} />

          {/* En-tête du profil */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Infos utilisateur */}
            <div className="md:col-span-2">
              <Card className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{user.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </CardDescription>
                      </div>
                    </div>
                    {user.role === "admin" && (
                      <Badge className="bg-red-100 text-red-700 border-red-200">
                        Administrateur
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500">{stats.resourcesContributed}</div>
                      <p className="text-xs text-muted-foreground mt-1">Ressources soumises</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500">{stats.resourcesTested}</div>
                      <p className="text-xs text-muted-foreground mt-1">Ressources testées</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500">{stats.commentsPosted}</div>
                      <p className="text-xs text-muted-foreground mt-1">Commentaires</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-500">{stats.collectionsCreated}</div>
                      <p className="text-xs text-muted-foreground mt-1">Collections</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Niveau et progression */}
            <Card className="shadow-elegant">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Niveau
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">Contributeur actif</span>
                    <span className="text-sm text-muted-foreground">Niveau 3</span>
                  </div>
                  <div className="bg-muted rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-2/3" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">650 / 1000 points</p>
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Prochains jalons :</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>✓ 10 ressources soumises</li>
                    <li>✓ 50 ressources testées</li>
                    <li>○ 100 commentaires postés</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Onglets */}
          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="badges">Badges & Récompenses</TabsTrigger>
              <TabsTrigger value="activity">Activité récente</TabsTrigger>
              <TabsTrigger value="settings">Paramètres</TabsTrigger>
            </TabsList>

            {/* Onglet Badges */}
            <TabsContent value="badges" className="space-y-6">
              <UserBadges userId={user.id} stats={stats} />
            </TabsContent>

            {/* Onglet Activité */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activité récente</CardTitle>
                  <CardDescription>Vos dernières actions sur la plateforme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center gap-4 pb-4 border-b last:border-b-0"
                      >
                        <div className="text-2xl">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1">
                          <p className="font-medium">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Paramètres */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Préférences de notification</CardTitle>
                  <CardDescription>
                    Gérez vos notifications et préférences de communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications par email</p>
                      <p className="text-sm text-muted-foreground">
                        Recevez des mises à jour sur vos contributions
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium">Newsletter hebdomadaire</p>
                      <p className="text-sm text-muted-foreground">
                        Les meilleures ressources de la semaine
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="font-medium">Alertes de réponses au forum</p>
                      <p className="text-sm text-muted-foreground">
                        Soyez notifié quand quelqu'un répond à vos sujets
                      </p>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Confidentialité</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Modifier mon profil
                  </Button>
                  <Button variant="outline" className="w-full">
                    Changer mon mot de passe
                  </Button>
                  <Button variant="outline" className="w-full text-destructive">
                    Supprimer mon compte
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
