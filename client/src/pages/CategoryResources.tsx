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
    const roots = Array.isArray(categoryTree)
      ? (categoryTree as CategoryTreeNode[])
      : [];

    return (
      roots.find(
        (node) => String(node.slug ?? "").trim() === String(groupKey).trim()
      ) ?? null
    );
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

      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {currentGroupNode?.title?.trim() || humanizeCategoryLabel(groupKey)}
          </h1>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : subCategories.length === 0 ? (
            <div className="text-center space-y-4">
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
              <h2 className="text-2xl font-bold mb-6 text-center">
                Choisissez une sous-catégorie
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subCategories.map((sub) => {
                  const fullKey = `${groupKey}/${sub.slug}`;

                  return (
                    <Link
                      key={sub.slug}
                      href={`/resources?profil=${encodeURIComponent(profileId)}&categorie=${encodeURIComponent(fullKey)}`}
                    >
                      <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                        <CardContent className="p-6 flex items-center justify-between gap-4">
                          <h3 className="font-semibold text-lg flex-1">{sub.title}</h3>
                          <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </>
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