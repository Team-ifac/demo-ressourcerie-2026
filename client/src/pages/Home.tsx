import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Eye, ExternalLink } from "lucide-react";
import { trpc } from "@/lib/trpc";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
  let start = target * 0.2; // démarre à 20% pour effet plus fluide
    const increment = target / (duration / 16);

    const timer = window.setInterval(() => {
      start += increment;

      if (start >= target) {
        setValue(target);
        window.clearInterval(timer);
      } else {
        setValue(Math.floor(start));
      }
    }, 16);

    return () => window.clearInterval(timer);
  }, [target, duration]);

  return value;
}

export default function Home() {
  // ✅ Source unique et fiable : état connecté côté serveur (cookie)
  const { data: me } = trpc.auth.me.useQuery();

  const { data: popularResourcesRaw = [] } = trpc.resources.getHomePopularResources.useQuery(
    {
      autoLimit: 6,
    },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: editorialResources = [] } = trpc.resources.getHomeEditorialResources.useQuery(
    {
      limit: 6,
    },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: recentResources = [] } = trpc.resources.getHomeRecentResources.useQuery(
    {
      limit: 6,
    },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: homePlatformStats } = trpc.resources.getHomePlatformStats.useQuery(
    undefined,
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  const { data: homeStats } = trpc.resources.listPaginated.useQuery(
    {
      page: 1,
      limit: 1,
    },
    {
      staleTime: 0,
      refetchOnMount: "always",
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    }
  );

  // connecté réel
  const isReallyLogged = !!me;

  const popularResources = popularResourcesRaw.slice(0, 6);

  const totalVisibleResources =
    Number(homePlatformStats?.totalVisibleResources ?? 0) ||
    Number(homeStats?.pagination?.total ?? 0);

  const totalVisibleViews = Number(homePlatformStats?.totalVisibleViews ?? 0);
  const totalVisibleDownloads = Number(homePlatformStats?.totalVisibleDownloads ?? 0);
  const totalUsers = Number(homePlatformStats?.totalUsers ?? 0);

  const animatedTotalVisibleResources = useCountUp(totalVisibleResources);
  const animatedTotalVisibleViews = useCountUp(totalVisibleViews);
  const animatedTotalVisibleDownloads = useCountUp(totalVisibleDownloads);
  const animatedTotalUsers = useCountUp(totalUsers);

  const profiles: Array<{
    id: ProfileType;
    title: string;
    description: string;
    image: string;
    overlay: string;
  }> = [
    {
      id: "stagiaire_bafa",
      title: "Stagiaire BAFA/BAFD",
      description: "Ressources pour débuter et réussir votre formation",
      image: "/profiles/stagiaire-bafa.jpg",
      overlay: "from-green-800/38 via-emerald-600/16 to-green-500/10",
    },
    {
      id: "animateur",
      title: "Animateur·rice",
      description: "Ressources pour animer des activités et gérer des groupes",
      image: "/profiles/animateur.jpg",
      overlay: "from-blue-800/38 via-blue-600/16 to-sky-500/10",
    },
    {
      id: "directeur",
      title: "Directeur·rice",
      description: "Outils de gestion, management et administration",
      image: "/profiles/directeur.jpg",
      overlay: "from-orange-800/38 via-amber-600/16 to-orange-500/10",
    },
    {
      id: "formateur",
      title: "Formateur·rice",
      description: "Supports de formation et approfondissements thématiques",
      image: "/profiles/formateur.jpg",
      overlay: "from-purple-800/38 via-fuchsia-600/16 to-violet-500/10",
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
    const raw =
      (resource?.summary as string) ||
      (resource?.description as string) ||
      "";

    return raw
      .replace(/^Import \(Option B\)\s*/i, "")
      .replace(/\)\s*-\s*/g, ") • ")
      .trim();
  }

  function HomeSectionHeader({
    eyebrow,
    title,
    description,
    icon,
  }: {
    eyebrow: string;
    title: string;
    description: string;
    icon: ReactNode;
  }) {
    return (
      <div className="mb-5 flex items-start gap-4 md:mb-6">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          {icon}
        </div>

        <div className="min-w-0 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            {eyebrow}
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-foreground md:text-[2rem]">
            {title}
          </h2>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground md:text-[15px]">
            {description}
          </p>
        </div>
      </div>
    );
  }

  function ResourceHomeCard({
    resource,
  }: {
    resource: any;
  }) {
    const thumbSrc = getResourceThumbnail(resource);
    const text = getResourceText(resource);

    const profileLabel =
      resource.profileType === "stagiaire_bafa"
        ? "Stagiaire BAFA"
        : resource.profileType === "animateur"
        ? "Animateur"
        : resource.profileType === "directeur"
        ? "Directeur"
        : resource.profileType === "formateur"
        ? "Formateur"
        : resource.profileType?.replace(/_/g, " ");

    return (
      <Link href={`/resources/${resource.id}`}>
        <Card className="group h-full cursor-pointer overflow-hidden rounded-[28px] border border-border/60 bg-background/92 shadow-md backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5">
          <div className="aspect-[16/9] w-full overflow-hidden bg-muted">
            <img
              src={thumbSrc}
              alt={resource?.title || "Ressource"}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.04]"
              loading="lazy"
              onError={(e) => {
                const img = e.currentTarget;
                if (img.dataset.fallbackApplied === "1") return;
                img.dataset.fallbackApplied = "1";
                img.src = "/thumbnails/default-document.png";
              }}
            />
          </div>

          <CardContent className="flex h-[142px] flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary ring-1 ring-primary/15">
                {resource.type || "document"}
              </span>

              <div className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2.5 py-1 text-sm font-semibold text-foreground">
                <Eye className="h-4 w-4" />
                <span>{Number(resource.realViews ?? 0)}</span>
              </div>
            </div>

            <h3 className="line-clamp-2 min-h-[44px] text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
              {resource.title}
            </h3>

            {text ? (
              <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                {text}
              </p>
            ) : (
              <p className="mt-2 line-clamp-2 text-sm italic leading-5 text-muted-foreground">
                Aucun résumé disponible
              </p>
            )}

            <div className="mt-auto pt-3">
              <span className="text-xs font-medium text-muted-foreground">
                {profileLabel}
              </span>
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed bg-no-repeat"
      style={{
        backgroundImage:
          "linear-gradient(rgba(248, 250, 252, 0.90), rgba(248, 250, 252, 0.90)), url(/hero-background-v2.jpg)",
      }}
    >
      {/* Hero */}
      <section
        className="relative flex min-h-[420px] items-center px-4 py-24 lg:min-h-[460px]"
        style={{
          backgroundImage: "url(/hero-background-v2.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/35 to-black/45" />

        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <div className="mx-auto max-w-3xl rounded-3xl bg-black/20 px-6 py-10 backdrop-blur-[2px] md:px-10 md:py-12">
          <h1 className="mb-5 text-4xl font-bold leading-tight text-white drop-shadow-xl md:text-5xl lg:text-6xl">
            Bienvenue sur la{" "}
            <span className="text-blue-300">Ressourcerie ifac</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-base font-medium text-white/95 drop-shadow-md md:text-xl">
            Comprendre, animer, transmettre à portée de clic
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            {!isReallyLogged ? (
              <>
                <Link href="/auth/choice">
                  <Button size="lg" className="h-11 gap-2 px-6 shadow-lg shadow-primary/20">
                    🔓 Se connecter / créer un compte
                  </Button>
                </Link>

                <a
                  href="https://adhesion.ifac.asso.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="secondary" className="h-11 gap-2 px-6 shadow-lg">
                    Devenir membre ifac
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </>
            ) : (
              <>
                <Link href="/categorie/profil/animateur">
                  <Button size="lg" className="h-11 gap-2 px-6 shadow-lg shadow-primary/20">
                    🎯 Explorer les profils
                  </Button>
                </Link>

                <a
                  href="https://adhesion.ifac.asso.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="lg" variant="secondary" className="h-11 gap-2 px-6 shadow-lg">
                    Devenir membre ifac
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              </>
            )}
          </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-14 lg:py-16">
        <div className="mx-auto w-full max-w-[1880px] px-4 sm:px-6 lg:px-8 2xl:px-10">
          <div className="mb-8 text-center md:mb-10">
            <h2 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
              La plateforme en chiffres
            </h2>
            <p className="mx-auto max-w-3xl text-muted-foreground">
              Des indicateurs réels calculés à partir des contenus visibles sur la plateforme.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <Card className="rounded-[28px] border border-border/50 bg-background/78 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="px-6 py-7 text-center md:px-8">
                <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                  {animatedTotalVisibleResources}
                </div>
                <p className="mt-3 text-sm font-semibold md:text-base">
                  Ressources visibles
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-border/50 bg-background/78 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="px-6 py-7 text-center md:px-8">
                <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                  {animatedTotalVisibleViews}
                </div>
                <p className="mt-3 text-sm font-semibold md:text-base">
                  Vues des ressources visibles
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-border/50 bg-background/78 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="px-6 py-7 text-center md:px-8">
                <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                  {animatedTotalVisibleDownloads}
                </div>
                <p className="mt-3 text-sm font-semibold md:text-base">
                  Téléchargements cumulés
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-[28px] border border-border/50 bg-background/78 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
              <CardContent className="px-6 py-7 text-center md:px-8">
                <div className="text-4xl font-bold tracking-tight text-primary md:text-5xl">
                  {animatedTotalUsers}
                </div>
                <p className="mt-3 text-sm font-semibold md:text-base">
                  Utilisateurs inscrits
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Profils */}
      <section className="px-4 py-14 lg:py-16">
        <div className="mx-auto w-full max-w-[1880px] px-4 sm:px-6 lg:px-8 2xl:px-10">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="mb-3 text-4xl font-bold tracking-tight md:text-5xl">
              <span className="text-primary">Choisissez votre profil</span>
            </h2>
            <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
              Accédez rapidement aux ressources les plus adaptées à votre rôle.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
            {profiles.map((profile) => {
              const href = !isReallyLogged
                ? "/auth/choice"
                : `/categorie/profil/${profile.id}`;
              const label = !isReallyLogged ? "Découvrir" : "Explorer ce profil";

              const card = (
                <Card className="group h-full cursor-pointer overflow-hidden rounded-[28px] border border-border/50 bg-background/78 shadow-sm backdrop-blur-[2px] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-black/5">
                  <CardContent className="flex h-full flex-col items-center gap-0 p-0 text-center">
                    <div className="relative w-full aspect-[16/8] overflow-hidden">
                      <img
                        src={profile.image}
                        alt={profile.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/hero-background-v2.jpg";
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${profile.overlay}`} />
                      <div className="absolute inset-0 bg-black/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-5 md:p-6">
                      <div>
                        <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground md:text-xl">
                          {profile.title}
                        </h3>
                        <p className="min-h-[56px] text-sm leading-6 text-muted-foreground/90">
                          {profile.description}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="mt-4 h-11 w-full font-medium transition-all group-hover:bg-primary group-hover:text-white"
                      >
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

      {/* Sections ressources */}
      <section className="py-8 md:py-10 xl:py-12">
        <div className="mx-auto w-full max-w-[1880px] px-4 sm:px-6 lg:px-8 2xl:px-10">
          <div className="space-y-10 md:space-y-12">
            {/* ifac à la une */}
            <div className="rounded-[32px] border border-border/50 bg-background/55 px-6 py-6 shadow-sm backdrop-blur-[2px] sm:px-7 lg:px-8">
              <HomeSectionHeader
                eyebrow="Sélection éditoriale"
                title="ifac à la une"
                description="Une sélection de ressources mises en avant pour guider, inspirer et valoriser les contenus les plus utiles de la plateforme."
                icon={<span className="text-lg leading-none">★</span>}
              />

              {editorialResources.length === 0 ? (
                <Card className="border-dashed bg-background/90">
                  <CardContent className="p-8 text-center">
                    <p className="mb-2 text-lg font-medium">
                      Aucune ressource mise en avant pour le moment
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Pour alimenter cette section, ajoute des ressources dans la collection nommée
                      <span className="font-medium"> ifac à la une</span>.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {editorialResources.map((resource: any) => (
                    <ResourceHomeCard
                      key={resource.id}
                      resource={resource}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Populaires */}
            {popularResources.length > 0 && (
              <div className="rounded-[32px] border border-border/50 bg-background/55 px-6 py-6 shadow-sm backdrop-blur-[2px] sm:px-7 lg:px-8">
                <HomeSectionHeader
                  eyebrow="Sélection dynamique"
                  title="Ressources populaires"
                  description="Les ressources les plus consultées du moment, mises en avant pour refléter l’usage réel de la plateforme."
                  icon={<Eye className="h-5 w-5" />}
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {popularResources.map((resource: any) => (
                    <ResourceHomeCard
                      key={resource.id}
                      resource={resource}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Récentes */}
            {recentResources.length > 0 && (
              <div className="rounded-[32px] border border-border/50 bg-background/55 px-6 py-6 shadow-sm backdrop-blur-[2px] sm:px-7 lg:px-8">
                <HomeSectionHeader
                  eyebrow="Nouveautés"
                  title="Dernières ressources ajoutées"
                  description="Les contenus récemment publiés pour suivre en temps réel les nouveautés de la plateforme."
                  icon={<span className="text-lg leading-none">🕒</span>}
                />

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {recentResources.map((resource: any) => (
                    <ResourceHomeCard
                      key={resource.id}
                      resource={resource}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
