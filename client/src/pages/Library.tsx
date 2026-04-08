import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Heart, Download, Loader2, BookOpen } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Library() {
  const utils = trpc.useUtils();
  const { data: favorites = [], isLoading } = trpc.favorites.list.useQuery();

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.list.invalidate();
      toast.success("Ressource retirée des favoris");
    },
  });

  const handleRemoveFavorite = (resourceId: number) => {
    removeFavoriteMutation.mutate({ resourceId });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage:
          "linear-gradient(rgba(248,250,252,0.9), rgba(248,250,252,0.9)), url('/bibliotheque-bg.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
      }}
    >
      <main className="flex-1 py-8 md:py-10">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ma bibliothèque" }]} />

          <section className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <Heart className="h-7 w-7 fill-current" />
                </div>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    Ma bibliothèque
                  </h1>
                  <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
                    Retrouvez ici toutes les ressources que vous avez sauvegardées en
                    favoris, pour y revenir rapidement et les consulter plus facilement.
                  </p>
                </div>
              </div>

              {!isLoading && favorites.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border bg-background/80 px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Ressources enregistrées
                    </p>
                    <p className="mt-1 text-2xl font-bold">{favorites.length}</p>
                  </div>

                  <div className="rounded-2xl border bg-background/80 px-4 py-3 shadow-sm">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Accès rapide
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      Vos contenus favoris
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>

          {isLoading ? (
            <Card className="rounded-3xl border-dashed py-16 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Loader2 className="h-7 w-7 animate-spin" />
                </div>

                <div className="space-y-1">
                  <p className="text-base font-semibold">
                    Chargement de votre bibliothèque
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Nous récupérons vos favoris enregistrés.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : favorites.length === 0 ? (
            <Card className="rounded-3xl border-dashed py-14 shadow-sm">
              <CardContent className="text-center">
                <div className="mx-auto flex max-w-md flex-col items-center space-y-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <BookOpen className="h-8 w-8" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xl font-semibold">
                      Votre bibliothèque est vide
                    </p>
                    <p className="text-sm text-muted-foreground md:text-base">
                      Explorez le catalogue et ajoutez des ressources à vos favoris
                      pour les retrouver facilement ici.
                    </p>
                  </div>

                  <Button asChild size="lg" className="rounded-full px-6">
                    <Link href="/resources">Explorer les ressources</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <section className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border bg-card/60 px-4 py-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    Vos ressources favorites
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {favorites.length} ressource{favorites.length > 1 ? "s" : ""} sauvegardée
                    {favorites.length > 1 ? "s" : ""}
                  </p>
                </div>

                <div className="inline-flex items-center rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  Accès rapide à vos contenus enregistrés
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {favorites.map((resource) => (
                  <Card
                    key={resource.id}
                    className="group overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/20 hover:shadow-2xl"
                  >
                    <Link href={`/resources/${resource.id}`}>
                      {resource.thumbnailUrl && (resource as any).accessLevel !== "PREMIUM" ? (
                        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                          />
                        </div>
                      ) : (
                        <div className="flex aspect-[16/10] w-full items-center justify-center bg-muted/50">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background text-primary shadow-sm">
                            <BookOpen className="h-7 w-7" />
                          </div>
                        </div>
                      )}

                      <CardHeader className="space-y-3 pb-4">
                        <div className="space-y-2">
                          <CardTitle className="line-clamp-2 text-lg leading-tight transition-colors group-hover:text-primary">
                            {resource.title}
                          </CardTitle>
                          <CardDescription className="line-clamp-2 text-sm leading-6">
                            {resource.summary}
                          </CardDescription>
                        </div>

                        <div className="flex flex-wrap gap-2">
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
                        </div>
                      </CardHeader>
                    </Link>

                    <CardContent className="pt-0">
                      <div className="rounded-2xl bg-muted/40 px-3 py-2 text-xs font-medium text-muted-foreground">
                        {resource.visibility === "PUBLIC" ? "Public" : "Interne ifac"}
                      </div>
                    </CardContent>

                    <CardFooter className="flex items-center justify-between gap-3 pt-4">
                      <p className="text-xs text-muted-foreground">
                        Enregistrée dans vos favoris
                      </p>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 rounded-full p-0 transition-all hover:bg-primary/10 hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveFavorite(resource.id);
                          }}
                          disabled={removeFavoriteMutation.isPending}
                          title="Retirer des favoris"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>

                        {(resource as any).hasFile && (resource as any).canOpen && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-9 w-9 rounded-full p-0 transition-all hover:bg-primary/10 hover:text-primary"
                            onClick={(e) => {
                              e.preventDefault();
                              window.open(`/api/resources/download/${resource.id}`, "_blank");
                            }}
                            title="Télécharger"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}