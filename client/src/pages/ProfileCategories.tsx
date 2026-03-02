import { useEffect, useMemo } from "react";
import { useLocation, useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

type CanonProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa" | "decouvrir";

// Infos UI (titre/description/image) — on garde ton design,
// mais on ne garde PLUS les catégories codées en dur.
const PROFILE_INFO: Record<
  CanonProfileType,
  { title: string; description: string; image: string }
> = {
  animateur: {
    title: "Animateur·rice",
    description: "Explorez les ressources par catégorie pour enrichir vos animations",
    image: "/profil-animateur.png",
  },
  formateur: {
    title: "Formateur·rice",
    description: "Accédez aux supports de formation et approfondissements",
    image: "/profil-formateur.png",
  },
  directeur: {
    title: "Directeur·rice",
    description: "Trouvez les outils de gestion et management adaptés",
    image: "/profil-directeur.png",
  },
  stagiaire_bafa: {
    title: "Stagiaire BAFA",
    description: "Découvrez les ressources pour réussir votre formation",
    image: "/profil-stagiaire.png",
  },
  decouvrir: {
    title: "Découvrir",
    description: "Explorez l'univers de l'animation pédagogique",
    image: "/profil-decouvrir.png",
  },
};

// Alias URL -> profil canonique côté DB
const PROFILE_ALIASES: Record<string, CanonProfileType> = {
  animateur: "animateur",
  formateur: "formateur",
  directeur: "directeur",

  // stagiaire
  stagiaire: "stagiaire_bafa",
  stagiaire_bafa: "stagiaire_bafa",
  "stagiaire-bafa": "stagiaire_bafa",
  stagiairebafa: "stagiaire_bafa",
  stagiaire_bafd: "stagiaire_bafa",
  "stagiaire-bafd": "stagiaire_bafa",

  // decouvrir
  decouvrir: "decouvrir",
};

function normalizeProfileSlug(slug: string | undefined): CanonProfileType | null {
  if (!slug) return null;
  const raw = String(slug).trim().toLowerCase();
  if (raw in PROFILE_ALIASES) return PROFILE_ALIASES[raw];

  const cleaned = raw.replace(/\s+/g, "_");
  if (cleaned in PROFILE_ALIASES) return PROFILE_ALIASES[cleaned];

  return null;
}

function humanizeCategoryLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

type GroupCard = {
  groupKey: string;          // ex: "temps-d-apports-et-de-reflexion"
  groupLabel: string;        // ex: "Temps D Apports Et De Reflexion" (humanized)
  sampleSubs: string[];      // ex: ["connaissance-des-publics", "menee-de-jeux"]
};

export default function ProfileCategories() {
  const params = useParams();
  const [, navigate] = useLocation();

  // sécurité: page profil => connecté
  const { data: me, isLoading: meLoading } = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!meLoading && !me) navigate("/auth/choice");
  }, [meLoading, me, navigate]);

  if (meLoading) return null;
  if (!me) return null;

  const profileId = normalizeProfileSlug(params.profile);

  if (!profileId) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  const profileInfo = PROFILE_INFO[profileId];

  // On lit les catégories réelles depuis la base, filtrées par profil.
  // (Pour "decouvrir", on ne force pas de profil ici : on montre tout.)
  const dbProfileType = profileId === "decouvrir" ? undefined : (profileId as any);

  const { data: categoryKeys = [], isLoading } = trpc.resources.listCategories.useQuery(
    dbProfileType ? { profileType: dbProfileType } : undefined,
    { staleTime: 60_000 }
  );

  const groupCards: GroupCard[] = useMemo(() => {
    // categoryKey en base = ex "temps-d-apports-et-de-reflexion/connaissance-des-publics"
    const map = new Map<string, Set<string>>();

    for (const key of categoryKeys) {
      if (!key || typeof key !== "string") continue;

      const [group, sub] = key.split("/");
      if (!group) continue;

      if (!map.has(group)) map.set(group, new Set<string>());
      if (sub) map.get(group)!.add(sub);
    }

    return Array.from(map.entries())
      .map(([group, subs]) => ({
        groupKey: group,
        groupLabel: humanizeCategoryLabel(group),
        sampleSubs: Array.from(subs).sort((a, b) => a.localeCompare(b)).slice(0, 6),
      }))
      .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  }, [categoryKeys]);

  return (
    <div className="min-h-screen">
      <Breadcrumb items={[{ label: "Accueil", href: "/" }, { label: profileInfo.title }]} />

      {/* Hero */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-elegant flex-shrink-0">
              <img
                src={profileInfo.image}
                alt={profileInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">{profileInfo.title}</h1>
              <p className="text-xl text-muted-foreground">{profileInfo.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Grille catégories */}
      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Choisissez une catégorie</h2>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : groupCards.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune catégorie trouvée pour ce profil.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groupCards.map((g) => (
                <Link
                  key={g.groupKey}
                  href={`/categorie/profil/${encodeURIComponent(profileId)}/${encodeURIComponent(g.groupKey)}`}
                >
                  <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-semibold text-lg flex-1">{g.groupLabel}</h3>
                        <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                      </div>

                      {/* aperçu sous-catégories */}
                      {g.sampleSubs.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {g.sampleSubs.map((s) => (
                            <span
                              key={s}
                              className="text-xs px-2 py-1 rounded-full border bg-background text-muted-foreground"
                            >
                              {humanizeCategoryLabel(s)}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link href="/ressources">
              <button className="text-primary hover:underline">
                Voir toutes les ressources sans filtre →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
