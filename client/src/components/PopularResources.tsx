import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye } from "lucide-react";
import { trpc } from "@/lib/trpc";

export function PopularResources({ limit = 6 }: { limit?: number }) {
  const { data: popularResources = [], isLoading } =
    trpc.resources.getHomePopularResources.useQuery({
      autoLimit: limit,
    });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(limit)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-muted rounded mb-4" />
              <div className="h-4 bg-muted rounded w-3/4 mb-2" />
              <div className="h-3 bg-muted rounded w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!popularResources || popularResources.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-primary/5 to-background">
      <div className="container max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Ressources <span className="text-primary">populaires</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Les ressources les plus consultées et appréciées par la communauté
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularResources.map((resource: any) => (
            <Link key={resource.id} href={`/resources/${resource.id}`}>
              <Card className="h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer group overflow-hidden border-0">
                <CardContent className="p-0 flex flex-col h-full">
                  {resource.thumbnailUrl && (
                    <div className="w-full aspect-video overflow-hidden bg-muted relative">
                      <img
                        src={resource.thumbnailUrl}
                        alt={resource.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {resource.viewCount && (
                        <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1 text-white text-xs font-medium">
                          <Eye className="w-3 h-3" />
                          {resource.viewCount}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Badge
                        variant={
                          resource.visibility === "PUBLIC" ? "default" : "secondary"
                        }
                      >
                        {resource.visibility === "PUBLIC" ? "Public" : "Interne ifac"}
                      </Badge>

                      {resource.type && <Badge variant="outline">{resource.type}</Badge>}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 flex-1">
                      {resource.title}
                    </h3>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {resource.summary}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-auto">
                      {resource.ageRange && <span className="flex items-center gap-1">👥 {resource.ageRange}</span>}
                      {resource.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {resource.duration}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}