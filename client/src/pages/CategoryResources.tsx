import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

type CanonProfileType =
  | "animateur"
  | "formateur"
  | "directeur"
  | "stagiaire_bafa"
  | "decouvrir";

const PROFILE_ALIASES: Record<string, CanonProfileType> = {
  animateur: "animateur",
  formateur: "formateur",
  directeur: "directeur",

  stagiaire: "stagiaire_bafa",
  stagiaire_bafa: "stagiaire_bafa",
  "stagiaire-bafa": "stagiaire_bafa",
  stagiairebafa: "stagiaire_bafa",
  stagiaire_bafd: "stagiaire_bafa",
  "stagiaire-bafd": "stagiaire_bafa",

  decouvrir: "decouvrir",
};

const PROFILE_HERO_IMAGES: Partial<Record<CanonProfileType, string>> = {
  animateur: "/profiles/hero-animateur.jpg",
  formateur: "/profiles/hero-formateur.jpg",
  directeur: "/profiles/hero-directeur.jpg",
  stagiaire_bafa: "/profiles/hero-stagiaire-bafa.jpg",
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

  const normalized = raw.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

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

function normalizeCategoryIdentity(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

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

export default function CategoryResources() {
  const params = useParams();

  const routeType = params.type ? String(params.type) : "";
  const routeKey = params.key ? String(params.key) : "";
  const routeCategory = params.category ? String(params.category) : "";

  const profileId = routeType === "profil" ? normalizeProfileSlug(routeKey) : null;
  const groupKey = routeCategory;

  if (routeType !== "profil" || !profileId || !groupKey) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Catégorie introuvable</p>
      </div>
    );
  }

  const dbProfileType =
    profileId && profileId !== "decouvrir" ? profileId : undefined;

  const { data: categoryTree = [], isLoading } =
    trpc.resources.getCategoryTreeByProfile.useQuery(
      dbProfileType
        ? {
            profileType: dbProfileType as
              | "animateur"
              | "formateur"
              | "directeur"
              | "stagiaire_bafa",
          }
        : (undefined as never),
      {
        staleTime: 60_000,
        enabled: !!dbProfileType,
      }
    );

  const currentGroupNode = useMemo(() => {
    const nodes = Array.isArray(categoryTree)
      ? (categoryTree as CategoryTreeNode[])
      : [];

    const stack: CategoryTreeNode[] = [...nodes];
    const matches: CategoryTreeNode[] = [];

    while (stack.length > 0) {
      const node = stack.shift();

      if (!node) continue;

      if (String(node.slug ?? "").trim() === String(groupKey).trim()) {
        matches.push(node);
      }

      if (Array.isArray(node.children) && node.children.length > 0) {
        stack.push(...node.children);
      }
    }

    if (matches.length === 0) {
      return null;
    }

    return matches
      .slice()
      .sort((a, b) => {
        const aActiveChildren = Array.isArray(a.children)
          ? a.children.filter((child) => Number(child.isActive ?? 0) === 1).length
          : 0;

        const bActiveChildren = Array.isArray(b.children)
          ? b.children.filter((child) => Number(child.isActive ?? 0) === 1).length
          : 0;

        if (bActiveChildren !== aActiveChildren) {
          return bActiveChildren - aActiveChildren;
        }

        return Number(a.id ?? 0) - Number(b.id ?? 0);
      })[0];
  }, [categoryTree, groupKey]);

  const subCategories = useMemo(() => {
    if (!currentGroupNode || !Array.isArray(currentGroupNode.children)) {
      return [];
    }

    const uniqueChildren = Array.from(
      currentGroupNode.children.reduce(
        (map: Map<string, CategoryTreeNode>, child: CategoryTreeNode) => {
          if (Number(child.isActive ?? 0) !== 1) return map;

          const slug = String(child.slug ?? "").trim();
          if (!slug) return map;

          const rawTitle =
            String(child.title ?? "").trim().length > 0
              ? String(child.title).trim()
              : slug;

          const displayTitle = humanizeCategoryLabel(rawTitle);
          const dedupeKey = normalizeCategoryIdentity(displayTitle || slug);

          const existing = map.get(dedupeKey);
          if (!existing) {
            map.set(dedupeKey, child);
            return map;
          }

          const existingSort = Number(existing.sortOrder ?? 0);
          const currentSort = Number(child.sortOrder ?? 0);

          if (currentSort < existingSort) {
            map.set(dedupeKey, child);
            return map;
          }

          if (currentSort === existingSort && Number(child.id) < Number(existing.id)) {
            map.set(dedupeKey, child);
          }

          return map;
        },
        new Map<string, CategoryTreeNode>()
      ).values()
    );

    return uniqueChildren
      .slice()
      .sort((a, b) => {
        if ((a.sortOrder ?? 0) !== (b.sortOrder ?? 0)) {
          return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        }

        const aLabel = humanizeCategoryLabel(
          String(a.title ?? "").trim() || String(a.slug ?? "")
        );
        const bLabel = humanizeCategoryLabel(
          String(b.title ?? "").trim() || String(b.slug ?? "")
        );

        return aLabel.localeCompare(bLabel, "fr");
      })
      .map((child) => {
        const slug = String(child.slug ?? "").trim();
        const rawTitle =
          String(child.title ?? "").trim().length > 0
            ? String(child.title).trim()
            : slug;

        return {
          slug,
          title: humanizeCategoryLabel(rawTitle),
        };
      })
      .filter((child) => child.slug.length > 0);
  }, [currentGroupNode]);

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Profil", href: `/categorie/profil/${profileId}` },
          { label: humanizeCategoryLabel(groupKey) },
        ]}
      />

      <section className="relative overflow-hidden px-4 pb-24 pt-8 md:px-6 md:pt-10">
        <div className="absolute inset-0 overflow-hidden">
          {PROFILE_HERO_IMAGES[profileId] ? (
            <img
              src={PROFILE_HERO_IMAGES[profileId]}
              alt=""
              className="h-full w-full object-cover scale-[1.14] opacity-[0.52]"
            />
          ) : (
            <div className="absolute inset-0 bg-slate-100" />
          )}

          <div className="absolute inset-0 bg-white/58" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.34),rgba(248,250,252,0.80))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(255,255,255,0.42),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.24),transparent_25%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.24),transparent_25%)]" />
          <div className="absolute inset-y-0 left-0 w-[10%] bg-white/28" />
          <div className="absolute inset-y-0 right-0 w-[10%] bg-white/28" />
        </div>

        <div className="relative w-full px-6 md:px-10 xl:px-16 2xl:px-24">
          <div className="relative min-h-[240px] overflow-hidden rounded-[30px] border border-black/10 shadow-xl shadow-black/10 md:min-h-[280px]">
            {PROFILE_HERO_IMAGES[profileId] ? (
              <img
                src={PROFILE_HERO_IMAGES[profileId]}
                alt={humanizeCategoryLabel(groupKey)}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-background to-background" />
            )}

            <div className="absolute inset-0 bg-gradient-to-r from-black/38 via-black/16 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent" />

            <div className="relative flex min-h-[240px] items-end md:min-h-[280px]">
              <div className="w-full px-6 pb-6 md:px-10 md:pb-10">
                <div className="max-w-2xl rounded-3xl border border-white/20 bg-white/12 p-6 shadow-2xl backdrop-blur-md md:p-7">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/75">
                    Navigation thématique
                  </p>
                  <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                    {currentGroupNode?.title?.trim() || humanizeCategoryLabel(groupKey)}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 md:text-base">
                    Explorez les sous-catégories disponibles pour accéder plus rapidement
                    aux ressources les plus pertinentes de cette thématique.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <p className="pt-12 text-center text-muted-foreground">Chargement…</p>
          ) : subCategories.length === 0 ? (
            <div className="pt-12 text-center space-y-4">
              <p className="text-muted-foreground">
                Pas de sous-catégories trouvées. Vous pouvez accéder directement au catalogue filtré.
              </p>

              <Link
                href={`/resources?profil=${encodeURIComponent(profileId)}&categorie=${encodeURIComponent(groupKey)}`}
              >
                <button className="text-primary hover:underline">
                  Ouvrir le catalogue filtré →
                </button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-10 mt-14 text-center">
                <div className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-600">
                  Navigation thématique
                </div>

                <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
                  Choisissez une sous-catégorie
                </h2>

                <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 md:text-base">
                  Accédez directement aux contenus associés à cette thématique.
                </p>

                <div className="mx-auto mt-5 h-1.5 w-1.5 rounded-full bg-sky-500" />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {subCategories.map((sub) => {
                  const fullKey = `${groupKey}/${sub.slug}`;

                  return (
                    <Link
                      key={sub.slug}
                      href={`/resources?profil=${encodeURIComponent(profileId)}&categorie=${encodeURIComponent(fullKey)}`}
                    >
                      <Card className="group relative h-full cursor-pointer overflow-hidden rounded-[28px] border border-slate-200 bg-white/90 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.10)]">
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500" />
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.82),rgba(248,250,252,0.94))]" />

                        <CardContent className="relative flex h-full min-h-[210px] flex-col justify-between p-6">
 <div className="space-y-3">
  <span className="inline-flex w-fit rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
    Explorer
  </span>

  <h3 className="text-[1.55rem] font-bold leading-tight text-slate-900">
    {sub.title}
  </h3>
</div>

<div className="flex items-center justify-between border-t border-slate-200/80 pt-4">
  <span className="text-sm text-slate-500">
    Voir les ressources
  </span>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-sky-600 transition-all duration-300 group-hover:translate-x-1 group-hover:border-sky-200 group-hover:bg-sky-50">
                              <ArrowRight className="h-4 w-4" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
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