import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { CheckCircle2, XCircle, AlertTriangle, Eye, Trash2, MessageSquare, FileText } from "lucide-react";

interface PendingResource {
  id: number;
  title: string;
  author: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  reason?: string;
}

interface FlaggedContent {
  id: number;
  type: "comment" | "forum_post" | "resource";
  title: string;
  author: string;
  flaggedBy: string;
  reason: string;
  flaggedAt: string;
  status: "pending" | "resolved" | "dismissed";
}

export default function AdminModeration() {
  const [pendingResources] = useState<PendingResource[]>([
    {
      id: 1,
      title: "Activité de team building innovante",
      author: "Jean Dupont",
      submittedAt: "2024-12-30",
      status: "pending",
    },
    {
      id: 2,
      title: "Guide de gestion des conflits",
      author: "Marie Martin",
      submittedAt: "2024-12-29",
      status: "pending",
    },
  ]);

  const [flaggedContents] = useState<FlaggedContent[]>([
    {
      id: 1,
      type: "comment",
      title: "Commentaire sur ressource #42",
      author: "User123",
      flaggedBy: "User456",
      reason: "Contenu offensant",
      flaggedAt: "2024-12-30",
      status: "pending",
    },
    {
      id: 2,
      type: "forum_post",
      title: "Sujet: Problème avec les enfants difficiles",
      author: "Formateur2024",
      flaggedBy: "Modérateur",
      reason: "Spam",
      flaggedAt: "2024-12-28",
      status: "resolved",
    },
  ]);

  const handleApproveResource = (id: number) => {
    alert(`Ressource ${id} approuvée`);
  };

  const handleRejectResource = (id: number) => {
    alert(`Ressource ${id} rejetée`);
  };

  const handleResolveFlagged = (id: number) => {
    alert(`Contenu flaggé ${id} résolu`);
  };

  const handleDeleteContent = (id: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce contenu ?")) {
      alert(`Contenu ${id} supprimé`);
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Modération</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les ressources en attente d'approbation et les contenus signalés
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>En attente ({pendingResources.length})</span>
            </TabsTrigger>
            <TabsTrigger value="flagged" className="gap-2">
              <Flag className="h-4 w-4" />
              <span>Signalés ({flaggedContents.length})</span>
            </TabsTrigger>
            <TabsTrigger value="stats" className="gap-2">
              <Eye className="h-4 w-4" />
              <span>Statistiques</span>
            </TabsTrigger>
          </TabsList>

          {/* Pending Resources Tab */}
          <TabsContent value="pending" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {pendingResources.length} ressource(s) en attente d'approbation
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {pendingResources.map((resource) => (
                <Card key={resource.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Auteur: {resource.author}</p>
                          <p>Soumis: {resource.submittedAt}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleApproveResource(resource.id)}
                        >
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          Approuver
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2"
                          onClick={() => handleRejectResource(resource.id)}
                        >
                          <XCircle className="h-4 w-4 text-red-600" />
                          Rejeter
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Flagged Content Tab */}
          <TabsContent value="flagged" className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {flaggedContents.filter((f) => f.status === "pending").length} contenu(s) signalé(s) en attente
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {flaggedContents.map((content) => (
                <Card key={content.id} className={content.status === "pending" ? "border-orange-200" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{content.title}</h3>
                          <Badge variant={content.status === "pending" ? "destructive" : "secondary"}>
                            {content.status === "pending" ? "Signalé" : "Résolu"}
                          </Badge>
                          <Badge variant="outline">
                            {content.type === "comment"
                              ? "Commentaire"
                              : content.type === "forum_post"
                                ? "Sujet forum"
                                : "Ressource"}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Auteur: {content.author}</p>
                          <p>Raison: {content.reason}</p>
                          <p>Signalé par: {content.flaggedBy}</p>
                          <p>Date: {content.flaggedAt}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {content.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2"
                              onClick={() => handleResolveFlagged(content.id)}
                            >
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              Résoudre
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => handleDeleteContent(content.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ressources approuvées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">247</div>
                  <p className="text-xs text-muted-foreground">+12 cette semaine</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Ressources rejetées</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-xs text-muted-foreground">-2 cette semaine</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Contenus supprimés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">Signalés et supprimés</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Temps moyen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2h</div>
                  <p className="text-xs text-muted-foreground">Pour approuver</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activité de modération</CardTitle>
                <CardDescription>Dernières actions des modérateurs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Ressource approuvée: "Guide de leadership"</span>
                    <span className="text-muted-foreground">Il y a 2h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Contenu supprimé: Commentaire offensant</span>
                    <span className="text-muted-foreground">Il y a 4h</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Ressource rejetée: "Activité non pertinente"</span>
                    <span className="text-muted-foreground">Il y a 1 jour</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Icône Flag
function Flag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  );
}
