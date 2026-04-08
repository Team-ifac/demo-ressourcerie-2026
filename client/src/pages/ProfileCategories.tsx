import { useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BookOpen,
  Globe,
  Palette,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

type CanonProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa" | "decouvrir";

// Infos UI (titre/description/image) — on garde ton design,
// mais on ne garde PLUS les catégories codées en dur.
const PROFILE_INFO: Record<
  CanonProfileType,
  { title: string; description: string; image: string; accent: string }
> = {
  animateur: {
    title: "Animateur·rice",
    description: "Explorez les ressources par catégorie pour enrichir vos animations",
    image: "/profiles/hero-animateur.jpg",
    accent: "sky",
  },
  formateur: {
    title: "Formateur·rice",
    description: "Accédez aux supports de formation et approfondissements",
    image: "/profiles/hero-formateur.jpg",
    accent: "violet",
  },
  directeur: {
    title: "Directeur·rice",
    description: "Trouvez les outils de gestion et management adaptés",
    image: "/profiles/hero-directeur.jpg",
    accent: "emerald",
  },
  stagiaire_bafa: {
    title: "Stagiaire BAFA",
    description: "Découvrez les ressources pour réussir votre formation",
    image: "/profiles/hero-stagiaire-bafa.jpg",
    accent: "amber",
  },
  decouvrir: {
    title: "Découvrir",
    description: "Explorez l'univers de l'animation pédagogique",
    image: "/profil-decouvrir.png",
    accent: "rose",
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

const CARD_ICONS = [BookOpen, Shield, Users, Globe, Palette, Sparkles] as const;

const ACCENT_STYLES = {
  sky: {
    soft: "bg-sky-50",
    softBorder: "border-sky-200",
    softText: "text-sky-700",
    ring: "ring-sky-200",
    accent: "from-sky-500 via-cyan-500 to-blue-500",
    accentSoft: "from-sky-500/10 via-cyan-500/10 to-blue-500/10",
    orb: "bg-sky-400/15",
    button: "bg-sky-500/10 text-sky-700 ring-sky-500/15 group-hover:bg-sky-500 group-hover:text-white group-hover:ring-sky-500/30",
    chip: "bg-sky-50 border-sky-200 text-sky-700",
    featuredText: "group-hover:text-sky-700",
  },
  violet: {
    soft: "bg-violet-50",
    softBorder: "border-violet-200",
    softText: "text-violet-700",
    ring: "ring-violet-200",
    accent: "from-violet-500 via-fuchsia-500 to-pink-500",
    accentSoft: "from-violet-500/10 via-fuchsia-500/10 to-pink-500/10",
    orb: "bg-violet-400/15",
    button: "bg-violet-500/10 text-violet-700 ring-violet-500/15 group-hover:bg-violet-500 group-hover:text-white group-hover:ring-violet-500/30",
    chip: "bg-violet-50 border-violet-200 text-violet-700",
    featuredText: "group-hover:text-violet-700",
  },
  emerald: {
    soft: "bg-emerald-50",
    softBorder: "border-emerald-200",
    softText: "text-emerald-700",
    ring: "ring-emerald-200",
    accent: "from-emerald-500 via-teal-500 to-cyan-500",
    accentSoft: "from-emerald-500/10 via-teal-500/10 to-cyan-500/10",
    orb: "bg-emerald-400/15",
    button: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15 group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500/30",
    chip: "bg-emerald-50 border-emerald-200 text-emerald-700",
    featuredText: "group-hover:text-emerald-700",
  },
  amber: {
    soft: "bg-amber-50",
    softBorder: "border-amber-200",
    softText: "text-amber-700",
    ring: "ring-amber-200",
    accent: "from-amber-500 via-orange-500 to-rose-500",
    accentSoft: "from-amber-500/10 via-orange-500/10 to-rose-500/10",
    orb: "bg-amber-400/15",
    button: "bg-amber-500/10 text-amber-700 ring-amber-500/15 group-hover:bg-amber-500 group-hover:text-white group-hover:ring-amber-500/30",
    chip: "bg-amber-50 border-amber-200 text-amber-700",
    featuredText: "group-hover:text-amber-700",
  },
  rose: {
    soft: "bg-rose-50",
    softBorder: "border-rose-200",
    softText: "text-rose-700",
    ring: "ring-rose-200",
    accent: "from-rose-500 via-pink-500 to-fuchsia-500",
    accentSoft: "from-rose-500/10 via-pink-500/10 to-fuchsia-500/10",
    orb: "bg-rose-400/15",
    button: "bg-rose-500/10 text-rose-700 ring-rose-500/15 group-hover:bg-rose-500 group-hover:text-white group-hover:ring-rose-500/30",
    chip: "bg-rose-50 border-rose-200 text-rose-700",
    featuredText: "group-hover:text-rose-700",
  },
} as const;

export default function ProfileCategories() {
  const params = useParams();

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
    return;
  }, []);

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
      const parentIdKey = String(node.parentIdKey ?? "").trim();

      const isRootLike =
        node.parentId === null || parentIdKey === "__ROOT__";

      return (
        Number(node.isActive ?? 0) === 1 &&
        isRootLike &&
        slug !== "document" &&
        title !== "document"
      );
    });

    const uniqueRoots = Array.from(
      rootCandidates.reduce((map, node) => {
        const displayLabel = normalizeDisplayLabel(
          String(node.title ?? "").trim(),
          String(node.slug ?? "").trim()
        );

        const displayKey = displayLabel
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[’']/g, "'")
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .toLowerCase()
          .trim();

        if (!displayKey) return map;

        const existing = map.get(displayKey);

        const scoreNode = (candidate: CategoryTreeNode) => {
          const title = String(candidate.title ?? "").trim();
          const slug = String(candidate.slug ?? "").trim();

          let score = 0;

          if (title && !title.includes("-") && !title.includes("_")) score += 3;
          if (title && /[A-ZÀ-ÿ]/.test(title)) score += 2;
          if (title && title.includes("'")) score += 1;
          if (title && title.includes("’")) score += 1;
          if (slug && slug.includes("-")) score += 0.5;

          return score;
        };

        if (!existing) {
          map.set(displayKey, node);
          return map;
        }

        const existingScore = scoreNode(existing);
        const currentScore = scoreNode(node);

        if (currentScore > existingScore) {
          map.set(displayKey, node);
          return map;
        }

        if (currentScore === existingScore) {
          const existingSort = Number(existing.sortOrder ?? 0);
          const currentSort = Number(node.sortOrder ?? 0);

          if (currentSort < existingSort) {
            map.set(displayKey, node);
            return map;
          }

          if (currentSort === existingSort && Number(node.id) < Number(existing.id)) {
            map.set(displayKey, node);
          }
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
      <div />

       {/* Hero */}
      <section className="relative w-full py-10 md:py-12">
        <div className="relative w-full min-h-[320px] overflow-hidden md:min-h-[420px]">
          <img
            src={profileInfo.image}
            alt={profileInfo.title}
            className="absolute inset-0 h-full w-full object-cover scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/42 via-black/18 to-black/8" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-transparent" />
          <div className="absolute -top-20 right-10 h-72 w-72 rounded-full bg-white/25 blur-3xl opacity-70" />

          <div className="relative flex min-h-[320px] items-end md:min-h-[420px]">
            <div className="container max-w-7xl mx-auto px-4 md:px-8 lg:px-10">
              <div className="max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-lg md:p-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  Parcours par profil
                </p>

                <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  {profileInfo.title}
                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-white/85 md:text-base">
                  {profileInfo.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grille catégories */}
      <section className="relative overflow-hidden px-4 pb-24 pt-14 md:px-6 md:pt-18">
        <div className="absolute inset-0 overflow-hidden">
          <img
            src={profileInfo.image}
            alt=""
            className="h-full w-full object-cover scale-[1.12] opacity-[0.72]"
          />

          {/* voile principal pour lisibilité */}
          <div className="absolute inset-0 bg-white/42" />

          {/* gradient pour profondeur */}
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.20),rgba(248,250,252,0.68))]" />

          {/* effets lumière */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.34),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.18),transparent_24%)]" />

          {/* bords adoucis */}
          <div className="absolute inset-y-0 left-0 w-[8%] bg-white/22" />
          <div className="absolute inset-y-0 right-0 w-[8%] bg-white/22" />
        </div>

        <div className="relative w-full px-6 md:px-10 xl:px-16 2xl:px-24">
          <div className="mb-16 text-center">
            <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
              Navigation thématique
            </div>

            <h2 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl">
              Choisissez une catégorie
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-slate-500">
              Explorez les grandes thématiques de ce profil pour accéder plus rapidement
              aux ressources les plus pertinentes.
            </p>

            <div className="mx-auto mt-6 h-1.5 w-1.5 rounded-full bg-sky-500" />
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : groupCards.length === 0 ? (
            <p className="text-center text-muted-foreground">Aucune catégorie trouvée pour ce profil.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {groupCards.map((g, index) => {
                const toneKeys = ["sky", "emerald", "violet", "amber", "rose"] as const;
                const accent = ACCENT_STYLES[toneKeys[index % toneKeys.length]];
                const Icon = CARD_ICONS[index % CARD_ICONS.length];

                return (
                  <a
                    key={g.groupKey}
                    href={`/categorie/profil/${encodeURIComponent(profileId)}/${encodeURIComponent(g.groupKey)}`}
                    className="block h-full"
                  >
                    <Card className="group relative h-full min-h-[160px] overflow-hidden rounded-[26px] border border-slate-200/90 bg-white/88 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
                      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent.accent}`} />
                      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.78),rgba(248,250,252,0.92))]" />
                      <div className={`absolute -left-8 -top-8 h-24 w-24 rounded-full ${accent.orb} blur-2xl`} />

                      <CardContent className="relative flex h-full flex-col p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ring-1 ${accent.soft} ${accent.ring}`}>
                              <Icon className={`h-4.5 w-4.5 ${accent.softText}`} />
                            </div>

                            <div className={`inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ring-1 ${accent.soft} ${accent.softBorder} ${accent.softText}`}>
                              Catégorie
                            </div>
                          </div>

                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-400 transition-all duration-300 group-hover:translate-x-1 group-hover:text-slate-700">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>

                        <div className="mt-6">
                          <h3 className="text-[1.95rem] font-bold leading-tight text-slate-900">
                            {normalizeDisplayLabel(g.groupLabel)}
                          </h3>
                        </div>

                        <div className="mt-auto pt-4">
                          <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 transition-all duration-300 ${accent.button}`}>
                            Explorer la catégorie
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </a>
                );
              })}
            </div>
          )}

          <div className="mt-16 text-center">
            <Link href="/resources">
              <button className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-6 py-3.5 text-sm font-semibold text-sky-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-sky-100">
                Voir toutes les ressources sans filtre
                <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
