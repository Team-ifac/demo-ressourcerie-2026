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

function humanizeCategoryLabel(label: string): string {
  const raw = String(label ?? "").trim();
  if (!raw) return "";

  const normalized = raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = normalized.toLowerCase();

  const words = lower.split(" ").filter(Boolean);

  const formatted = words.map((word, index) => {
    if (!word) return word;

    if (["de", "des", "du", "et", "en", "la", "le", "les", "aux"].includes(word)) {
      return index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word;
    }

    if (word === "ifac") return "ifac";
    if (word === "bafa") return "BAFA";
    if (word === "acm") return "ACM";
    if (word === "co") return "Co";

    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  let result = formatted.join(" ");

  result = result
    .replace(/\bD ([AEIOUYaeiouy])/g, "D’$1")
    .replace(/\bL ([AEIOUYaeiouy])/g, "L’$1")
    .replace(/\bQu ([AEIOUYaeiouy])/g, "Qu’$1")
    .replace(/\bC ([AEIOUYaeiouy])/g, "C’$1")
    .replace(/\bJ ([AEIOUYaeiouy])/g, "J’$1")
    .replace(/\bN ([AEIOUYaeiouy])/g, "N’$1")
    .replace(/\bS ([AEIOUYaeiouy])/g, "S’$1")
    .replace(/\bMenee\b/g, "Menée")
    .replace(/\bReunion\b/g, "Réunion")
    .replace(/\bReflexion\b/g, "Réflexion")
    .replace(/\bGenerale\b/g, "Générale")
    .replace(/\bRegie\b/g, "Régie")
    .replace(/\bDifferentes\b/g, "Différentes")
    .replace(/\bActivites\b/g, "Activités")
    .replace(/\bActivite\b/g, "Activité")
    .replace(/\bPedagogique\b/g, "Pédagogique")
    .replace(/\bPedagogie\b/g, "Pédagogie")
    .replace(/\bEmotions\b/g, "Émotions")
    .replace(/\bEtude\b/g, "Étude")
    .replace(/\bEquipe\b/g, "Équipe")
    .replace(/\bAnimation\b/g, "Animation");

  return result;
}

function normalizeDisplayLabel(label: string, fallbackSlug?: string): string {
  const raw = String(label ?? "").trim();

  if (!raw && fallbackSlug) {
    return humanizeCategoryLabel(fallbackSlug);
  }

  const looksTechnical =
    raw.includes("-") ||
    raw.includes("_") ||
    /^[A-Z][a-z]+(?: [A-Z][a-z]+)+$/.test(raw) ||
    /\bD\b/.test(raw) ||
    /\bL\b/.test(raw);

  if (looksTechnical) {
    return humanizeCategoryLabel(raw);
  }

  return raw;
}

type GroupCard = {
  groupKey: string;
  groupLabel: string;
  sampleSubs: string[];
};

export default function ProfileCategories() {
  const params = useParams();
  const [, navigate] = useLocation();

  type CategoryTreeNode = {
    id: number;
    parentId: number | null;
    parentIdKey: string;
    slug: string;
    title: string;
    description?: string | null;
    sortOrder: number;
    isActive: number;
    children: CategoryTreeNode[];
  };

  const profileId = normalizeProfileSlug(params.profile);
  const dbProfileType =
    profileId && profileId !== "decouvrir" ? profileId : undefined;

  // sécurité: page profil => connecté
  const { data: me, isLoading: meLoading } = trpc.auth.me.useQuery();

  const { data: categoryTree = [], isLoading } =
    trpc.resources.getCategoryTreeByProfile.useQuery(
      dbProfileType
        ? { profileType: dbProfileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa" }
        : undefined as never,
      {
        staleTime: 60_000,
        enabled: !!dbProfileType && !!me,
      }
    );

  useEffect(() => {
    if (!meLoading && !me) navigate("/auth/choice");
  }, [meLoading, me, navigate]);

    const groupCards: GroupCard[] = useMemo(() => {
    const nodes = Array.isArray(categoryTree) ? (categoryTree as CategoryTreeNode[]) : [];

    const collectAllNodes = (input: CategoryTreeNode[]): CategoryTreeNode[] => {
      const result: CategoryTreeNode[] = [];

      const visit = (node: CategoryTreeNode) => {
        result.push(node);

        if (Array.isArray(node.children) && node.children.length > 0) {
          node.children.forEach(visit);
        }
      };

      input.forEach(visit);
      return result;
    };

    const allNodes = collectAllNodes(nodes);

    const rootCandidates = allNodes.filter((node) => {
      const slug = String(node.slug ?? "").trim().toLowerCase();
      const title = String(node.title ?? "").trim().toLowerCase();

      return (
        Number(node.isActive ?? 0) === 1 &&
        node.parentId === null &&
        slug !== "document" &&
        title !== "document"
      );
    });

    const uniqueRoots = Array.from(
      rootCandidates.reduce((map, node) => {
        const key = String(node.slug ?? "").trim().toLowerCase();
        if (!key) return map;

        const existing = map.get(key);

        if (!existing) {
          map.set(key, node);
          return map;
        }

        const existingSort = Number(existing.sortOrder ?? 0);
        const currentSort = Number(node.sortOrder ?? 0);

        if (currentSort < existingSort) {
          map.set(key, node);
          return map;
        }

        if (currentSort === existingSort && Number(node.id) < Number(existing.id)) {
          map.set(key, node);
        }

        return map;
      }, new Map<string, CategoryTreeNode>())
      .values()
    );

    return uniqueRoots
      .slice()
      .sort((a, b) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }
        return String(a.title ?? "").localeCompare(String(b.title ?? ""));
      })
      .map((node) => {
        const uniqueChildren = Array.from(
          (Array.isArray(node.children) ? node.children : []).reduce((map, child) => {
            const childKey = String(child.slug ?? "").trim().toLowerCase();
            if (!childKey) return map;
            if (Number(child.isActive ?? 0) !== 1) return map;

            const existing = map.get(childKey);

            if (!existing) {
              map.set(childKey, child);
              return map;
            }

            const existingSort = Number(existing.sortOrder ?? 0);
            const currentSort = Number(child.sortOrder ?? 0);

            if (currentSort < existingSort) {
              map.set(childKey, child);
              return map;
            }

            if (currentSort === existingSort && Number(child.id) < Number(existing.id)) {
              map.set(childKey, child);
            }

            return map;
          }, new Map<string, CategoryTreeNode>()).values()
        );

        return {
          groupKey: String(node.slug ?? "").trim(),
          groupLabel:
            String(node.title ?? "").trim().length > 0
              ? String(node.title)
              : humanizeCategoryLabel(String(node.slug ?? "")),
          sampleSubs: Array.from(uniqueChildren)
            .slice()
            .sort((a, b) => {
              if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
                return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
              }
              return String(a.title ?? "").localeCompare(String(b.title ?? ""));
            })
            .map(
              (child) =>
                String(child.title ?? "").trim() ||
                humanizeCategoryLabel(String(child.slug ?? ""))
            )
            .slice(0, 6),
        };
      })
      .filter((card) => !!card.groupKey);
  }, [categoryTree]);

  if (meLoading) return null;
  if (!me) return null;

  if (!profileId) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Profil non trouvé</p>
      </div>
    );
  }

  const profileInfo = PROFILE_INFO[profileId];

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
            <Link href="/resources">
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
