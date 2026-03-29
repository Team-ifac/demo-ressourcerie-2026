import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen flex flex-col bg-background">
      
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ma bibliothèque" }]} />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="h-8 w-8 text-primary fill-current" />
              <h1 className="text-4xl font-bold">Ma bibliothèque</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Retrouvez ici toutes les ressources que vous avez sauvegardées en favoris.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : favorites.length === 0 ? (
            <Card className="py-12 shadow-elegant">
              <CardContent className="text-center space-y-4">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Votre bibliothèque est vide</p>
                  <p className="text-muted-foreground">
                    Explorez le catalogue et ajoutez des ressources à vos favoris pour les retrouver facilement ici.
                  </p>
                </div>
                <Button asChild className="mt-4">
                  <Link href="/resources">Explorer les ressources</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {favorites.length} ressource{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((resource) => (
                  <Card key={resource.id} className="hover:shadow-elegant transition-all duration-300 group">
                    <Link href={`/resources/${resource.id}`}>
                      {resource.thumbnailUrl && (resource as any).accessLevel !== "PREMIUM" && (
                        <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
                          <img
                            src={resource.thumbnailUrl}
                            alt={resource.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <CardHeader>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {resource.title}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {resource.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {resource.type && (
                            <Badge variant="secondary">{resource.type}</Badge>
                          )}
                          {resource.ageRange && (
                            <Badge variant="outline">{resource.ageRange}</Badge>
                          )}
                          {resource.duration && (
                            <Badge variant="outline">{resource.duration}</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Link>
                    <CardFooter className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {resource.visibility === "PUBLIC" ? "Public" : "Interne IFAC"}
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={(e) => {
                            e.preventDefault();
                            handleRemoveFavorite(resource.id);
                          }}
                          disabled={removeFavoriteMutation.isPending}
                        >
                          <Heart className="h-4 w-4 fill-current" />
                        </Button>
                        {(resource as any).hasFile && (resource as any).canOpen && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
