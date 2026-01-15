import { useState, useEffect } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Heart, Download, Lock, Globe, ArrowLeft } from "lucide-react";
import { Link, useLocation, useRoute } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { PROFILE_CATEGORIES, NEED_CATEGORIES } from "@shared/categories";

export default function CategoryResources() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();

  // Parse URL to get type (profil or besoin), key, and category
  // URL format: /categorie/:type/:key/:category
  const [match, params] = useRoute("/categorie/:type/:key/:category");
  
  const type = params?.type; // "profil" or "besoin"
  const key = params?.key; // e.g., "animateur", "formateur", etc.
  const categoryEncoded = params?.category;
  const category = categoryEncoded ? decodeURIComponent(categoryEncoded) : "";

  // Get the title based on type and key
  const getTitle = () => {
    if (type === "profil") {
      const titles: Record<string, string> = {
        animateur: "Animateur·rice",
        formateur: "Formateur·rice",
        directeur: "Directeur·rice",
        stagiaire: "Stagiaire BAFA/BAFD",
        decouvrir: "Découvrir",
      };
      return titles[key || ""] || "Profil";
    } else if (type === "besoin") {
      const titles: Record<string, string> = {
        preparer: "Préparer rapidement",
        projet: "Monter un projet",
        gerer: "Gérer une situation",
        competences: "Monter en compétences",
      };
      return titles[key || ""] || "Besoin";
    }
    return "";
  };

  const title = getTitle();

  // Fetch resources filtered by category
  const { data: resources = [], isLoading } = trpc.resources.list.useQuery({
    category: category || undefined,
  });

  const { data: favorites = [] } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user,
  });

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      trpc.useUtils().favorites.list.invalidate();
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      trpc.useUtils().favorites.list.invalidate();
    },
  });

  const isFavorite = (resourceId: number) => {
    return favorites.some((fav: any) => fav.resourceId === resourceId);
  };

  const toggleFavorite = (resourceId: number) => {
    if (!user) {
      alert("Vous devez être connecté·e pour ajouter des favoris");
      return;
    }

    if (isFavorite(resourceId)) {
      removeFavoriteMutation.mutate({ resourceId });
    } else {
      addFavoriteMutation.mutate({ resourceId });
    }
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: title, href: `/${type}/${key}` },
    { label: category },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-primary/5">
      
      <main className="flex-1 container py-8">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-8 mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">{category}</h1>
            <p className="text-muted-foreground">
              Ressources pour {title.toLowerCase()}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate(`/${type}/${key}`)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux catégories
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des ressources...</p>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border">
            <p className="text-muted-foreground text-lg">
              Aucune ressource disponible dans cette catégorie pour le moment.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              De nouvelles ressources seront ajoutées prochainement.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-6">
              {resources.length} ressource{resources.length > 1 ? "s" : ""} trouvée{resources.length > 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                  {resource.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                      <img
                        src={resource.imageUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{resource.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{resource.type}</Badge>
                      {resource.ageRange && <Badge variant="outline">{resource.ageRange}</Badge>}
                      {resource.duration && <Badge variant="outline">{resource.duration}</Badge>}
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      {resource.visibility === "PUBLIC" ? (
                        <>
                          <Globe className="w-4 h-4 text-green-600" />
                          <span className="text-green-600">Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-orange-600" />
                          <span className="text-orange-600">Interne IFAC</span>
                        </>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Link href={`/resources/${resource.id}`}>
                      <Button variant="default" size="sm">
                        Voir détails
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(resource.id)}
                        className={isFavorite(resource.id) ? "text-red-500" : ""}
                      >
                        <Heart
                          className="w-5 h-5"
                          fill={isFavorite(resource.id) ? "currentColor" : "none"}
                        />
                      </Button>
                      {resource.fileUrl && (
                        <a href={resource.fileUrl} download target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="icon">
                            <Download className="w-5 h-5" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
