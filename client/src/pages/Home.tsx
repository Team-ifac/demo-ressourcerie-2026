import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { TrendingUp, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

export default function Home() {
  // ✅ Source unique et fiable : état connecté côté serveur (cookie)
  const { data: me } = trpc.auth.me.useQuery();

  const { data: popularResourcesRaw = [] } = trpc.resources.getHomePopularResources.useQuery({
    autoLimit: 6,
  });

  const { data: editorialResources = [] } = trpc.resources.getHomeEditorialResources.useQuery({
    limit: 6,
  });

  const { data: recentResources = [] } = trpc.resources.getHomeRecentResources.useQuery({
    limit: 6,
  });

  const { data: homePlatformStats } = trpc.resources.getHomePlatformStats.useQuery();

  const { data: homeStats } = trpc.resources.listPaginated.useQuery({
    page: 1,
    limit: 1,
  });

  // connecté réel
  const isReallyLogged = !!me;

  const popularResources = popularResourcesRaw.slice(0, 6);

  const totalVisibleResources =
    Number(homePlatformStats?.totalVisibleResources ?? 0) ||
    Number(homeStats?.pagination?.total ?? 0);

  const totalVisibleViews = Number(homePlatformStats?.totalVisibleViews ?? 0);
  const totalVisibleDownloads = Number(homePlatformStats?.totalVisibleDownloads ?? 0);
  const totalUsers = Number(homePlatformStats?.totalUsers ?? 0);

  const profiles: Array<{
  id: ProfileType;
  title: string;
  description: string;
  icon: string;
  color: string;
}> = [
  {
    id: "animateur",
    title: "Animateur·rice",
    description: "Ressources pour animer des activités et gérer des groupes",
    icon: "🎯",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "formateur",
    title: "Formateur·rice",
    description: "Supports de formation et approfondissements thématiques",
    icon: "📚",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "directeur",
    title: "Directeur·rice",
    description: "Outils de gestion, management et administration",
    icon: "🏢",
    color: "from-orange-500 to-orange-600",
  },
  {
    id: "stagiaire_bafa",
    title: "Stagiaire BAFA/BAFD",
    description: "Ressources pour débuter et réussir votre formation",
    icon: "🎓",
    color: "from-green-500 to-green-600",
  },
];

  /* =====================================================
     VIGNETTES – même logique que /resources (safe démo)
     ===================================================== */
  function getResourceThumbnail(resource: any): string {
    const accessLevel = (resource?.accessLevel ?? "PUBLIC") as
      | "PUBLIC"
      | "INTERNAL_IFAC"
      | "PREMIUM";

    // 🔒 Anti-fuite visuelle : pas de vignette pour PREMIUM
    if (accessLevel === "PREMIUM") {
      return "/thumbnails/default-document.png";
    }

    const thumbnailUrl = resource?.thumbnailUrl;

    // 1️⃣ thumbnailUrl explicite prioritaire
    if (typeof thumbnailUrl === "string" && thumbnailUrl.trim() !== "") {
      // base64 legacy
      if (thumbnailUrl.startsWith("data:image/")) {
        return thumbnailUrl;
      }

      // URL absolue
      if (thumbnailUrl.startsWith("http://") || thumbnailUrl.startsWith("https://")) {
        return thumbnailUrl;
      }

      // URL locale valide (Option B)
      if (thumbnailUrl.startsWith("/imported_thumbs/")) {
        return thumbnailUrl;
      }

      // Ancien /imported/xxx.pdf → transformation auto
      if (thumbnailUrl.startsWith("/imported/") && thumbnailUrl.toLowerCase().endsWith(".pdf")) {
        return thumbnailUrl
          .replace("/imported/", "/imported_thumbs/")
          .replace(/\.pdf$/i, ".png");
      }
    }

    // 2️⃣ Fallback neutre final (aucun fileUrl ici)
    return "/thumbnails/default-document.png";
  }

  function getResourceText(resource: any): string {
    // Home utilisait "description", ailleurs c'est souvent "summary"
    return (
      (resource?.summary as string) ||
      (resource?.description as string) ||
      ""
    );
  }

  function ResourceHomeCard({
    resource,
  }: {
    resource: any;
  }) {
    const thumbSrc = getResourceThumbnail(resource);
    const text = getResourceText(resource);

    return (
      <Link href={`/resources/${resource.id}`}>
        <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden">
          {/* Vignette */}
          <div className="aspect-video w-full bg-muted overflow-hidden">
            <img
              src={thumbSrc}
              alt={resource?.title || "Ressource"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = "/thumbnails/default-document.png";
              }}
            />
          </div>

          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {resource.title}
            </h3>

            {text ? (
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {text}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4 italic">
                (Aucun résumé)
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                {resource.type || "document"}
              </span>

              <span className="text-xs text-muted-foreground">
                {resource.viewCount ?? resource.views ?? 0} vues
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section
        className="relative py-32 px-4 min-h-[500px] flex items-center"
        style={{
          backgroundImage: "url(/hero-background-v2.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-black/20" />

        <div className="container relative z-10 max-w-4xl mx-auto text-center">
          <h1 className="text-6xl font-bold mb-6 text-white drop-shadow-lg">
            Bienvenue sur la{" "}
            <span className="text-blue-400">Ressourcerie ifac</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            Comprendre, animer, transmettre à portée de clic
          </p>

          <div className="flex gap-4 justify-center flex-wrap">
            {!isReallyLogged ? (
              <>
                <Link href="/auth/choice">
                  <Button size="lg" className="gap-2">
                    🔓 Se connecter / créer un compte
                  </Button>
                </Link>

                <a
                  href="https://adhesion.ifac.asso.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="secondary" className="gap-2">
                    Devenir membre ifac
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Link href="/selection-profil">
                  <Button size="lg" className="gap-2">
                    🎯 Choisir votre profil
                  </Button>
                </Link>

                <a
                  href="https://adhesion.ifac.asso.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="secondary" className="gap-2">
                    Devenir membre ifac
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary/5 via-background to-primary/5">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-3">La plateforme en chiffres</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Des indicateurs réels calculés à partir des contenus visibles sur la plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <Card className="border-0 shadow-sm bg-background/80 backdrop-blur">
              <CardContent className="p-8 text-center space-y-3">
                <div className="text-5xl font-bold text-primary">
                  {totalVisibleResources}
                </div>
                <p className="text-lg font-medium">Ressources visibles</p>
                <p className="text-sm text-muted-foreground">
                  Total réellement accessible dans le catalogue
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-background/80 backdrop-blur">
              <CardContent className="p-8 text-center space-y-3">
                <div className="text-5xl font-bold text-primary">
                  {totalVisibleViews}
                </div>
                <p className="text-lg font-medium">Vues cumulées</p>
                <p className="text-sm text-muted-foreground">
                  Consultations enregistrées sur les ressources visibles
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-background/80 backdrop-blur">
              <CardContent className="p-8 text-center space-y-3">
                <div className="text-5xl font-bold text-primary">
                  {totalVisibleDownloads}
                </div>
                <p className="text-lg font-medium">Téléchargements cumulés</p>
                <p className="text-sm text-muted-foreground">
                  Téléchargements réellement enregistrés sur les ressources visibles
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-background/80 backdrop-blur">
              <CardContent className="p-8 text-center space-y-3">
                <div className="text-5xl font-bold text-primary">
                  {totalUsers}
                </div>
                <p className="text-lg font-medium">Utilisateurs inscrits</p>
                <p className="text-sm text-muted-foreground">
                  Comptes actuellement enregistrés sur la plateforme
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Profils */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/20">
        <div className="container max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              <span className="text-primary">
                Bienvenue{isReallyLogged ? `, ${(me as any)?.name ?? ""}` : ""} !
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Sélectionnez un profil pour explorer les ressources
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {profiles.map((profile) => {
              const href = !isReallyLogged
                ? "/auth/choice"
                : `/profil/${profile.id}`;
              const label = !isReallyLogged ? "Découvrir" : "Explorer ce profil";

              const card = (
                <Card className="h-full transition-all duration-300 group overflow-hidden border-0 hover:shadow-2xl hover:-translate-y-2 cursor-pointer">
                  <CardContent className="p-0 flex flex-col items-center text-center gap-0 h-full">
                    <div
                      className={`w-full aspect-video bg-gradient-to-r ${profile.color} flex items-center justify-center relative overflow-hidden`}
                    >
                      <div className="text-6xl drop-shadow-lg">{profile.icon}</div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-center">
                      <h3 className="font-semibold text-lg mb-2">{profile.title}</h3>
                      <p className="text-sm text-muted-foreground">{profile.description}</p>
                      <Button variant="outline" className="mt-4 w-full">
                        {label}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );

              return (
                <Link key={profile.id} href={href}>
                  {card}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ifac à la une */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-12">
            <h2 className="text-4xl font-bold">⭐ ifac à la une</h2>
          </div>

          {editorialResources.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center">
                <p className="text-lg font-medium mb-2">
                  Aucune ressource mise en avant pour le moment
                </p>
                <p className="text-sm text-muted-foreground">
                  Pour alimenter cette section, ajoute des ressources dans la collection nommée
                  <span className="font-medium"> ifac à la une</span>.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {editorialResources.map((resource: any) => (
                <ResourceHomeCard
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Populaires */}
      {popularResources.length > 0 && (
        <section className="py-20 px-4 bg-background">
          <div className="container max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <TrendingUp className="h-8 w-8 text-primary" />
              <h2 className="text-4xl font-bold">Ressources populaires</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularResources.map((resource: any) => (
                <ResourceHomeCard
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Récentes */}
      {recentResources.length > 0 && (
        <section className="py-20 px-4 bg-muted/10">
          <div className="container max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-12">
              <h2 className="text-4xl font-bold">Dernières ressources ajoutées</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentResources.map((resource: any) => (
                <ResourceHomeCard
                  key={resource.id}
                  resource={resource}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
