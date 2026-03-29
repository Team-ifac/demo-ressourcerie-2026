
import { useEffect } from "react";
import { useRoute } from "wouter";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  Download,
  Heart,
  Clock,
  Users,
  Target,
  Timer,
  Globe,
  Lock,
  Loader2,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileArchive,
  Presentation,
  Sheet,
} from "lucide-react";
import { ShareButtons } from "@/components/ShareButtons";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { ExportPDF } from "@/components/ExportPDF";
import { PrintableVersion } from "@/components/PrintableVersion";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function ResourceDetail() {
  const [, params] = useRoute("/resources/:id");
  const resourceIdRaw = params?.id ?? "0";
  const resourceId = Number(resourceIdRaw);
  const hasValidResourceId = Number.isInteger(resourceId) && resourceId > 0;

  const { isAuthenticated } = useAuth();
  const utils = trpc.useUtils();

  const {
    data: resource,
    isLoading,
    error,
  } = trpc.resources.getById.useQuery(
    { id: resourceId },
    {
      enabled: hasValidResourceId,
      retry: false,
      staleTime: 1000 * 60 * 5,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    }
  );

  const { data: favoriteCheck } = trpc.favorites.check.useQuery(
    { resourceId },
    { enabled: isAuthenticated && hasValidResourceId }
  );

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      utils.favorites.check.invalidate({ resourceId });
      utils.favorites.list.invalidate();
      toast.success("Ressource ajoutée aux favoris");
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.check.invalidate({ resourceId });
      utils.favorites.list.invalidate();
      toast.success("Ressource retirée des favoris");
    },
  });

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      toast.error("Veuillez vous connecter pour ajouter des favoris");
      window.location.href = getLoginUrl();
      return;
    }

    if (favoriteCheck?.isFavorite) {
      removeFavoriteMutation.mutate({ resourceId });
    } else {
      addFavoriteMutation.mutate({ resourceId });
    }
  };

  // ✅ PRO : preview séparée de l’ouverture explicite
  const previewUrlQuery = trpc.resources.getFileUrl.useQuery(
    { id: resourceId },
    {
      enabled: false,
      retry: false,
    }
  );

  // ✅ PRO : téléchargement / ouverture explicite piloté par le backend
  const fileUrlQuery = trpc.resources.getFileUrl.useQuery(
    { id: resourceId },
    {
      enabled: false,
      retry: false,
    }
  );

  const resolvedFileKind = String(resource?.fileKind ?? "").toLowerCase();

  const previewUrl =
    ["pdf", "image", "video", "audio"].includes(resolvedFileKind)
      ? `/api/resources/preview/${resourceId}`
      : previewUrlQuery.data?.url ?? null;

  useEffect(() => {
    if (!hasValidResourceId) return;
    if (!resource) return;
    if (!resource.hasFile) return;
    if (!resource.canOpen) return;
    if (!["pdf", "image", "video", "audio"].includes(resolvedFileKind)) return;
    if (previewUrlQuery.data?.url) return;
    if (previewUrlQuery.isFetching) return;

    void previewUrlQuery.refetch();
  }, [
    hasValidResourceId,
    resource,
    resolvedFileKind,
    previewUrlQuery,
  ]);

function getActionLabel(fileKind?: string | null, fileExtension?: string | null) {
  const kind = String(fileKind ?? "").toLowerCase();
  const ext = String(fileExtension ?? "").toLowerCase();

  if (kind === "pdf") return "Ouvrir le document";
  if (kind === "image") return "Ouvrir l’image";
  if (kind === "video") return "Lire la vidéo";
  if (kind === "audio") return "Écouter l’audio";
  if (kind === "powerpoint" || kind === "presentation") return "Télécharger le PowerPoint";
  if (kind === "excel" || kind === "spreadsheet") return "Télécharger le fichier Excel";
  if (kind === "archive") return "Télécharger l’archive";
  if (kind === "document") return "Télécharger le document";

  if (["doc", "docx", "odt", "rtf", "txt", "md"].includes(ext)) {
    return "Télécharger le document";
  }

  return "Télécharger la ressource";
}
  const handleDownload = async () => {
    if (!resourceId || resourceId <= 0) {
      toast.error("Ressource invalide");
      return;
    }

    // 1) Pas de fichier
    if (!resource?.hasFile) {
      toast.error("Aucun fichier disponible");
      return;
    }

    // 2) Pas le droit d’ouvrir/télécharger
    if (!resource?.canOpen) {
      if (!isAuthenticated) {
        toast.error("Connexion requise pour télécharger cette ressource");
        window.location.href = getLoginUrl();
        return;
      }

      toast.error("Accès restreint : vous n’avez pas le droit de télécharger ce fichier");
      return;
    }

    try {
      const res = await fileUrlQuery.refetch();

      const url = res.data?.url;
      if (!url) {
        toast.error("Aucun fichier disponible");
        return;
      }

      // ✅ ouvre le lien fourni par le backend (signé / proxy / legacy)
      window.location.assign(url);
    } catch (e: any) {
      const code = e?.data?.code || e?.shape?.data?.code;

      if (code === "FORBIDDEN") {
        toast.error("Accès restreint : vous n’avez pas le droit de télécharger ce fichier");
        return;
      }
      if (code === "NOT_FOUND") {
        toast.error("Aucun fichier disponible");
        return;
      }

      toast.error("Impossible de récupérer le fichier");
    }
  };

  if (!hasValidResourceId) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Card className="py-12">
              <CardContent className="text-center space-y-2">
                <p className="text-lg font-medium">Ressource non trouvée</p>
                <p className="text-muted-foreground">
                  Cette ressource n&apos;existe pas ou l&apos;URL est invalide.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ✅ Gestion d’erreur tRPC propre
  if (error) {
    const code = (error as any)?.data?.code;

    if (code === "FORBIDDEN") {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <main className="flex-1 py-8">
            <div className="container">
              <Card className="py-12">
                <CardContent className="text-center space-y-3">
                  <p className="text-lg font-medium">Accès restreint</p>
                  <p className="text-muted-foreground">
                    Vous n’avez pas les droits pour consulter cette ressource.
                  </p>

                  {!isAuthenticated && (
                    <div className="pt-2">
                      <Button onClick={() => (window.location.href = getLoginUrl())}>
                        Se connecter
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      );
    }

    if (code === "NOT_FOUND") {
      return (
        <div className="min-h-screen flex flex-col bg-background">
          <main className="flex-1 py-8">
            <div className="container">
              <Card className="py-12">
                <CardContent className="text-center space-y-2">
                  <p className="text-lg font-medium">Ressource non trouvée</p>
                  <p className="text-muted-foreground">
                    Cette ressource n&apos;existe pas ou n&apos;est plus disponible.
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      );
    }

    console.error(error);
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Card className="py-12">
              <CardContent className="text-center space-y-2">
                <p className="text-lg font-medium">Erreur</p>
                <p className="text-muted-foreground">
                  Une erreur est survenue lors du chargement de la ressource.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 py-8">
          <div className="container">
            <Card className="py-12">
              <CardContent className="text-center space-y-2">
                <p className="text-lg font-medium">Ressource indisponible</p>
                <p className="text-muted-foreground">
                  Impossible de charger cette ressource pour le moment.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb
            items={[
              { label: "Ressources", href: "/resources" },
              { label: resource.title },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contenu principal */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-4xl font-bold">{resource.title}</h1>
                  {resource.accessLevel === "PREMIUM" ? (
                    <Badge variant="secondary" className="gap-1 flex-shrink-0">
                      <Lock className="h-3 w-3" />
                      Premium
                    </Badge>
                  ) : resource.accessLevel === "INTERNAL_IFAC" ? (
                    <Badge variant="secondary" className="gap-1 flex-shrink-0">
                      <Lock className="h-3 w-3" />
                      Interne ifac
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 flex-shrink-0">
                      <Globe className="h-3 w-3" />
                      Public
                    </Badge>
                  )}
                </div>

                <p className="text-xl text-muted-foreground">{resource.summary}</p>

                <div className="flex flex-wrap gap-2">
                  {resource.type && <Badge variant="secondary">{resource.type}</Badge>}
                  {resource.ageRange && <Badge variant="outline">{resource.ageRange}</Badge>}
                  {resource.duration && <Badge variant="outline">{resource.duration}</Badge>}
                  {resource.level && <Badge variant="outline">{resource.level}</Badge>}
                </div>
              </div>

              <Separator />

              {resource.accessLevel !== "PREMIUM" && resource.hasFile && (
                <Card className="shadow-elegant overflow-hidden">
                  <CardHeader>
                    <CardTitle>Aperçu de la ressource</CardTitle>
                    <CardDescription>
                      Consultation directe quand le format le permet
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {["pdf", "image", "video", "audio"].includes(resolvedFileKind) && (
                      <>
                        {previewUrlQuery.isFetching ? (
                          <div className="rounded-lg border bg-background p-6">
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Chargement de l’aperçu…
                            </div>
                          </div>
                        ) : previewUrl ? (
                          resolvedFileKind === "pdf" ? (
                            <div className="rounded-lg overflow-hidden border bg-background">
                              <iframe
                                src={previewUrl}
                                title={`${resource.title} - aperçu PDF`}
                                className="w-full h-[700px]"
                              />
                            </div>
                          ) : resolvedFileKind === "image" ? (
                            <div className="rounded-lg overflow-hidden border bg-background">
                              <img
                                src={previewUrl}
                                alt={resource.title}
                                className="w-full max-h-[700px] object-contain bg-white"
                              />
                            </div>
                          ) : resolvedFileKind === "video" ? (
                            <div className="rounded-lg overflow-hidden border bg-background p-2">
                              <video
                                src={previewUrl}
                                controls
                                className="w-full max-h-[700px] bg-black rounded-md"
                              />
                            </div>
                          ) : resolvedFileKind === "audio" ? (
                            <div className="rounded-lg border bg-background p-6 space-y-4">
                              <div className="flex items-start gap-3">
                                <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-medium">Aperçu audio</p>
                                  <p className="text-sm text-muted-foreground">
                                    Écoutez directement la ressource depuis la fiche.
                                  </p>
                                </div>
                              </div>
                              <audio src={previewUrl} controls className="w-full" />
                            </div>
                          ) : null
                        ) : (
                          <div className="rounded-lg border bg-background p-6 space-y-4">
                            <div className="flex items-start gap-3">
                              {resolvedFileKind === "audio" ? (
                                <Music className="h-5 w-5 text-muted-foreground mt-0.5" />
                              ) : resolvedFileKind === "video" ? (
                                <Video className="h-5 w-5 text-muted-foreground mt-0.5" />
                              ) : resolvedFileKind === "image" ? (
                                <ImageIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                              ) : (
                                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                              )}

                              <div className="space-y-1">
                                <p className="font-medium">Aperçu indisponible</p>
                                <p className="text-sm text-muted-foreground">
                                  L’aperçu n’a pas pu être chargé pour ce fichier. Utilisez le bouton
                                  d’action pour ouvrir ou télécharger la ressource.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                     {(resolvedFileKind === "powerpoint" ||
                      resolvedFileKind === "presentation") &&
                      (resource.previewPdfUrl ? (
                        <div className="rounded-lg overflow-hidden border bg-background">
                          <iframe
                            src={resource.previewPdfUrl}
                            title={`${resource.title} - aperçu PDF`}
                            className="w-full h-[700px]"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-background p-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <Presentation className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium">Fichier de présentation</p>
                              <p className="text-sm text-muted-foreground">
                                Ce format n’est pas encore prévisualisable directement dans la
                                plateforme. Utilisez le bouton d’action pour télécharger puis ouvrir
                                le fichier dans PowerPoint, Keynote, LibreOffice Impress ou un outil
                                compatible.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {(resolvedFileKind === "excel" ||
                      resolvedFileKind === "spreadsheet") &&
                      (resource.previewPdfUrl ? (
                        <div className="rounded-lg overflow-hidden border bg-background">
                          <iframe
                            src={resource.previewPdfUrl}
                            title={`${resource.title} - aperçu PDF`}
                            className="w-full h-[700px]"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-background p-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <Sheet className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium">Fichier tableur</p>
                              <p className="text-sm text-muted-foreground">
                                Ce format nécessite une application compatible pour une consultation
                                complète. Téléchargez le fichier pour l’ouvrir dans Excel, Numbers,
                                LibreOffice Calc ou un autre tableur.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {resolvedFileKind === "document" &&
                      (resource.previewPdfUrl ? (
                        <div className="rounded-lg overflow-hidden border bg-background">
                          <iframe
                            src={resource.previewPdfUrl}
                            title={`${resource.title} - aperçu PDF`}
                            className="w-full h-[700px]"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg border bg-background p-6 space-y-4">
                          <div className="flex items-start gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                              <p className="font-medium">Document bureautique</p>
                              <p className="text-sm text-muted-foreground">
                                Ce document peut être téléchargé puis ouvert dans Word, LibreOffice
                                Writer ou un outil compatible.
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                    {resolvedFileKind === "other" && resource.thumbnailUrl && (
                      <div className="rounded-lg overflow-hidden border bg-background">
                        <img
                          src={resource.thumbnailUrl}
                          alt={resource.title}
                          className="w-full aspect-video object-cover"
                        />
                      </div>
                    )}

                    {resolvedFileKind === "other" && !resource.thumbnailUrl && (
                      <div className="rounded-lg border bg-background p-6 space-y-4">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                          <div className="space-y-1">
                            <p className="font-medium">Aperçu non disponible</p>
                            <p className="text-sm text-muted-foreground">
                              Ce type de fichier n’a pas encore de visionneuse intégrée.
                              Utilisez le bouton d’action pour accéder au fichier.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card className="shadow-elegant">
                <CardHeader>
                  <CardTitle>Description détaillée</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap">{resource.content}</div>
                </CardContent>
              </Card>

              {resource.themes && resource.themes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thématiques</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {resource.themes?.map((theme: any) => (
                        <Badge key={theme.id} variant="secondary">
                          {theme.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card className="shadow-elegant sticky top-24">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>
                    Téléchargez ou ajoutez cette ressource à vos favoris
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <Button
  onClick={handleDownload}
  className="w-full gap-2"
  disabled={!resource?.hasFile || fileUrlQuery.isFetching}
>
                    {fileUrlQuery.isFetching ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Préparation…
                      </>
                    ) : !resource?.hasFile ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Aucun fichier
                      </>
                    ) : !resource?.canOpen ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Téléchargement restreint
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        {getActionLabel(resource?.fileKind, resource?.fileExtension)}
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleFavoriteToggle}
                    variant={favoriteCheck?.isFavorite ? "default" : "outline"}
                    className="w-full gap-2"
                    disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  >
                    <Heart
                      className={`h-4 w-4 ${
                        favoriteCheck?.isFavorite ? "fill-current" : ""
                      }`}
                    />
                    {favoriteCheck?.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  </Button>

                  <Separator className="my-2" />

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      PARTAGER & EXPORTER
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <ShareButtons
                        title={resource.title}
                        description={resource.summary}
                        url={`/resources/${resource.id}`}
                        resourceId={resource.id}
                      />
                      <QRCodeGenerator
                        resourceId={resource.id}
                        resourceTitle={resource.title}
                        url={`/resources/${resource.id}`}
                      />
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      <ExportPDF
                        resourceId={resource.id}
                        resourceTitle={resource.title}
                        resourceContent={{
                          title: resource.title,
                          description: resource.summary,
                          content: resource.content,
                          category: resource.type,
                          createdAt: new Date(resource.createdAt),
                        }}
                      />
                      <PrintableVersion
                        resourceId={resource.id}
                        resourceTitle={resource.title}
                        resourceContent={{
                          title: resource.title,
                          description: resource.summary || undefined,
                          content: resource.content || undefined,
                          category: resource.type || undefined,
                          difficulty: resource.level || undefined,
                          duration: resource.duration || undefined,
                          ageGroup: resource.ageRange || undefined,
                          createdAt: new Date(resource.createdAt),
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {resource.ageRange && (
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Public cible</p>
                        <p className="text-sm text-muted-foreground">{resource.ageRange}</p>
                      </div>
                    </div>
                  )}

                  {resource.duration && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Durée</p>
                        <p className="text-sm text-muted-foreground">{resource.duration}</p>
                      </div>
                    </div>
                  )}

                  {resource.prepTime && (
                    <div className="flex items-start gap-3">
                      <Timer className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Temps de préparation</p>
                        <p className="text-sm text-muted-foreground">{resource.prepTime}</p>
                      </div>
                    </div>
                  )}

                  {resource.level && (
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm">Niveau</p>
                        <p className="text-sm text-muted-foreground">{resource.level}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}