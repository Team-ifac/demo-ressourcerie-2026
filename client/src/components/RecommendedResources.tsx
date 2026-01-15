import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, Zap, TrendingUp } from "lucide-react";
import { Link } from "wouter";

interface RecommendedResource {
  id: number;
  title: string;
  description: string;
  category: string;
  tags: string[];
  score: number;
  reason: string;
  thumbnail?: string;
}

interface RecommendedResourcesProps {
  userId?: number;
  limit?: number;
  title?: string;
}

export function RecommendedResources({
  userId,
  limit = 6,
  title = "Ressources recommandées pour vous",
}: RecommendedResourcesProps) {
  const [resources, setResources] = useState<RecommendedResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        // Mock data pour la démonstration
        const mockRecommendations: RecommendedResource[] = [
          {
            id: 1,
            title: "Jeu des 5 sens avancé",
            description: "Une version améliorée du jeu des 5 sens avec variantes",
            category: "Jeux",
            tags: ["sensoriel", "groupe", "enfants"],
            score: 0.92,
            reason: "Basé sur vos favoris récents",
            thumbnail: "🎮",
          },
          {
            id: 2,
            title: "Gestion des émotions en groupe",
            description: "Techniques pour gérer les émotions dans un contexte collectif",
            category: "Formation",
            tags: ["émotions", "psychologie", "groupe"],
            score: 0.88,
            reason: "Tendance populaire cette semaine",
            thumbnail: "❤️",
          },
          {
            id: 3,
            title: "Activités outdoor pour l'été",
            description: "Collection d'activités adaptées à la saison estivale",
            category: "Activités",
            tags: ["outdoor", "été", "groupe"],
            score: 0.85,
            reason: "Basé sur vos recherches récentes",
            thumbnail: "☀️",
          },
          {
            id: 4,
            title: "Leadership pour jeunes animateurs",
            description: "Guide complet du leadership adapté aux jeunes",
            category: "Formation",
            tags: ["leadership", "formation", "jeunes"],
            score: 0.82,
            reason: "Similaire à vos ressources favorites",
            thumbnail: "👥",
          },
          {
            id: 5,
            title: "Jeux coopératifs innovants",
            description: "Nouvelle collection de jeux favorisant la coopération",
            category: "Jeux",
            tags: ["coopération", "jeux", "groupe"],
            score: 0.79,
            reason: "Vous avez aimé des ressources similaires",
            thumbnail: "🤝",
          },
          {
            id: 6,
            title: "Inclusion et accessibilité",
            description: "Ressources pour créer des activités inclusives",
            category: "Guides",
            tags: ["inclusion", "accessibilité", "diversité"],
            score: 0.76,
            reason: "Nouveau contenu dans votre domaine d'intérêt",
            thumbnail: "♿",
          },
        ];

        setResources(mockRecommendations.slice(0, limit));
      } catch (err) {
        setError("Erreur lors du chargement des recommandations");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [userId, limit]);

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">Découvrez des ressources adaptées à vos intérêts</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: limit }).map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{resource.title}</CardTitle>
                    <CardDescription>{resource.category}</CardDescription>
                  </div>
                  <div className="text-3xl ml-2">{resource.thumbnail}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {resource.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {resource.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {resource.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{resource.tags.length - 2}
                    </Badge>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-medium">{(resource.score * 100).toFixed(0)}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {resource.reason}
                    </span>
                  </div>
                </div>

                <Link href={`/resources/${resource.id}`}>
                  <Button className="w-full" variant="default" size="sm">
                    Voir la ressource
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Link href="/ressources?sort=recommended">
          <Button variant="outline" size="lg" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Voir toutes les recommandations
          </Button>
        </Link>
      </div>
    </div>
  );
}
