
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

          <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <Card className="overflow-hidden rounded-[32px] border border-border/50 bg-background/72 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.78),rgba(255,255,255,0.58))]" />
                <CardContent className="relative p-6 md:p-8 lg:p-10">
                  <div className="space-y-10">
                    <div className="rounded-[28px] border border-border/40 bg-white/72 p-5 shadow-sm backdrop-blur-sm md:p-6">
                      <div className="space-y-5">
                        <div className="flex flex-wrap gap-2">
                          {resource.accessLevel === "PREMIUM" ? (
                            <Badge className="gap-1 rounded-full">
                              <Lock className="h-3.5 w-3.5" />
                              Premium
                            </Badge>
                          ) : resource.accessLevel === "INTERNAL_IFAC" ? (
                            <Badge variant="secondary" className="gap-1 rounded-full">
                              <Lock className="h-3.5 w-3.5" />
                              Interne ifac
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 rounded-full">
                              <Globe className="h-3.5 w-3.5" />
                              Public
                            </Badge>
                          )}

                          {resource.type && (
                            <Badge variant="secondary" className="rounded-full">
                              {resource.type}
                            </Badge>
                          )}
                          {resource.ageRange && (
                            <Badge variant="outline" className="rounded-full">
                              {resource.ageRange}
                            </Badge>
                          )}
                          {resource.duration && (
                            <Badge variant="outline" className="rounded-full">
                              {resource.duration}
                            </Badge>
                          )}
                          {resource.level && (
                            <Badge variant="outline" className="rounded-full">
                              {resource.level}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-5xl xl:text-[3.4rem] xl:leading-[1.02]">
                            {resource.title}
                          </h1>

                          {resource.summary
                            ?.replace(/^Import \(Option B\)\s*/i, "")
                            ?.trim() && (
                            <p className="max-w-4xl text-sm font-medium leading-relaxed text-muted-foreground/90 md:text-base">
                              {resource.summary
                                ?.replace(/^Import \(Option B\)\s*/i, "")
                                ?.replace(/\)\s*-\s*/g, ") • ")
                                ?.trim()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {resource.accessLevel !== "PREMIUM" && resource.hasFile && (
                      <div className="space-y-6 border-t border-border/60 pt-8">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1.5">
                            <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                              Aperçu
                            </Badge>
                            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                              Aperçu de la ressource
                            </h2>
                            <p className="text-sm text-muted-foreground md:text-base">
                              Consultation directe quand le format le permet
                            </p>
                          </div>

                          <Badge variant="outline" className="hidden rounded-full sm:inline-flex">
                            {resolvedFileKind || "fichier"}
                          </Badge>
                        </div>

                        {["pdf", "image", "video", "audio"].includes(resolvedFileKind) && (
                          <>
                            {previewUrlQuery.isFetching ? (
                              <div className="rounded-[24px] border border-border/60 bg-background/80 p-8 shadow-sm">
                                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Chargement de l’aperçu…
                                </div>
                              </div>
                            ) : previewUrl ? (
                              resolvedFileKind === "pdf" ? (
                                <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                                  <iframe
                                    src={previewUrl}
                                    title={`${resource.title} - aperçu PDF`}
                                    className="h-[720px] w-full"
                                  />
                                </div>
                              ) : resolvedFileKind === "image" ? (
                                <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                                  <img
                                    src={previewUrl}
                                    alt={resource.title}
                                    className="max-h-[720px] w-full object-contain bg-white"
                                  />
                                </div>
                              ) : resolvedFileKind === "video" ? (
                                <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background p-3 shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                                  <video
                                    src={previewUrl}
                                    controls
                                    className="max-h-[720px] w-full rounded-[18px] bg-black"
                                  />
                                </div>
                              ) : resolvedFileKind === "audio" ? (
                                <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                      <Music className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                      <div className="space-y-1">
                                        <p className="font-medium">Aperçu audio</p>
                                        <p className="text-sm text-muted-foreground">
                                          Écoutez directement la ressource depuis la fiche.
                                        </p>
                                      </div>
                                    </div>
                                    <audio src={previewUrl} controls className="w-full" />
                                  </div>
                                </div>
                              ) : null
                            ) : (
                              <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                                <div className="flex items-start gap-3">
                                  {resolvedFileKind === "audio" ? (
                                    <Music className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                  ) : resolvedFileKind === "video" ? (
                                    <Video className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                  ) : resolvedFileKind === "image" ? (
                                    <ImageIcon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
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
                            <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                              <iframe
                                src={resource.previewPdfUrl}
                                title={`${resource.title} - aperçu PDF`}
                                className="h-[720px] w-full"
                              />
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                              <div className="flex items-start gap-3">
                                <Presentation className="mt-0.5 h-5 w-5 text-muted-foreground" />
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
                            <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                              <iframe
                                src={resource.previewPdfUrl}
                                title={`${resource.title} - aperçu PDF`}
                                className="h-[720px] w-full"
                              />
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                              <div className="flex items-start gap-3">
                                <Sheet className="mt-0.5 h-5 w-5 text-muted-foreground" />
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
                            <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                              <iframe
                                src={resource.previewPdfUrl}
                                title={`${resource.title} - aperçu PDF`}
                                className="h-[720px] w-full"
                              />
                            </div>
                          ) : (
                            <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                              <div className="flex items-start gap-3">
                                <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
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
                          <div className="overflow-hidden rounded-[24px] border border-border/60 bg-background shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
                            <img
                              src={resource.thumbnailUrl}
                              alt={resource.title}
                              className="aspect-video w-full object-cover"
                            />
                          </div>
                        )}

                        {resolvedFileKind === "other" && !resource.thumbnailUrl && (
                          <div className="rounded-[24px] border border-border/60 bg-background/80 p-6 shadow-sm">
                            <div className="flex items-start gap-3">
                              <FileText className="mt-0.5 h-5 w-5 text-muted-foreground" />
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
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
 <Card className="sticky top-24 border-border/60 shadow-md overflow-hidden">
  <CardHeader className="border-b border-border/50 bg-muted/30 pb-4">
    <CardTitle className="text-xl">Actions</CardTitle>
    <CardDescription>
      Ouvrir, enregistrer ou partager cette ressource
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-5 p-5">
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
      <Button
        onClick={handleDownload}
        className="h-12 w-full gap-2 text-sm font-semibold shadow-md shadow-primary/20"
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
    </div>

    <Button
      onClick={handleFavoriteToggle}
      variant={favoriteCheck?.isFavorite ? "default" : "outline"}
      className="h-11 w-full gap-2 text-sm font-medium"
      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
    >
      <Heart
        className={`h-4 w-4 ${
          favoriteCheck?.isFavorite ? "fill-current" : ""
        }`}
      />
      {favoriteCheck?.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    </Button>

    <Separator />

    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Partager & exporter
      </p>

      <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-wrap gap-2">
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

              <Card className="overflow-hidden rounded-[30px] border border-border/50 bg-background/78 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.52))]" />
                <CardHeader className="relative border-b border-border/50 bg-white/35 pb-4">
                  <Badge className="mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                    Informations
                  </Badge>
                  <CardTitle className="text-2xl tracking-tight">Repères rapides</CardTitle>
                  <CardDescription>
                    Les informations essentielles pour situer immédiatement la ressource.
                  </CardDescription>
                </CardHeader>

                <CardContent className="relative space-y-3 p-5">
                  {resource.ageRange && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/70 px-4 py-3 shadow-sm">
                      <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Public cible</p>
                        <p className="text-sm text-muted-foreground">{resource.ageRange}</p>
                      </div>
                    </div>
                  )}

                  {resource.duration && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/70 px-4 py-3 shadow-sm">
                      <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Durée</p>
                        <p className="text-sm text-muted-foreground">{resource.duration}</p>
                      </div>
                    </div>
                  )}

                  {resource.prepTime && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/70 px-4 py-3 shadow-sm">
                      <Timer className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Temps de préparation</p>
                        <p className="text-sm text-muted-foreground">{resource.prepTime}</p>
                      </div>
                    </div>
                  )}

                  {resource.level && (
                    <div className="flex items-start gap-3 rounded-2xl border border-border/50 bg-white/70 px-4 py-3 shadow-sm">
                      <Target className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                      <div>
                        <p className="text-sm font-semibold">Niveau</p>
                        <p className="text-sm text-muted-foreground">{resource.level}</p>
                      </div>
                    </div>
                  )}

                  {!resource.ageRange && !resource.duration && !resource.prepTime && !resource.level && (
                    <div className="rounded-2xl border border-dashed border-border/60 bg-white/60 px-4 py-4 text-sm text-muted-foreground">
                      Aucune information complémentaire n’est disponible pour cette ressource.
                    </div>
                  )}
                </CardContent>
              </Card>

              {resource.content && resource.content.trim().length > 0 && (
                <Card className="overflow-hidden rounded-[30px] border border-border/50 bg-background/78 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.52))]" />
                  <CardHeader className="relative border-b border-border/50 bg-white/35 pb-4">
                    <Badge className="mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                      Description
                    </Badge>
                    <CardTitle className="text-2xl tracking-tight">Description détaillée</CardTitle>
                    <CardDescription>
                      Le contenu complet de la ressource, présenté dans un format plus lisible.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative p-5 md:p-6">
                    <div className="rounded-[24px] border border-border/50 bg-white/70 px-5 py-5 shadow-sm">
                      <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/90 md:text-[15px]">
                        {resource.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {resource.themes && resource.themes.length > 0 && (
                <Card className="overflow-hidden rounded-[30px] border border-border/50 bg-background/78 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.52))]" />
                  <CardHeader className="relative border-b border-border/50 bg-white/35 pb-4">
                    <Badge className="mb-3 w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                      Thématiques
                    </Badge>
                    <CardTitle className="text-2xl tracking-tight">Axes associés</CardTitle>
                    <CardDescription>
                      Les thématiques liées à cette ressource pour mieux la situer dans le catalogue.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="relative p-5">
                    <div className="flex flex-wrap gap-2">
                      {resource.themes?.map((theme: any) => (
                        <Badge
                          key={theme.id}
                          variant="secondary"
                          className="rounded-full bg-white/80 px-3 py-1.5 shadow-sm"
                        >
                          {theme.name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}