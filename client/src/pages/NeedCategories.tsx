import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { NeedType } from "../../../shared/categories";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

const NEED_INFO: Record<
  NeedType,
  { title: string; description: string; image: string }
> = {
  preparer: {
    title: "Préparer rapidement",
    description: "Trouvez des solutions express pour vos animations",
    image: "/besoin-preparer.png",
  },
  projet: {
    title: "Monter un projet",
    description: "Construisez des projets complets et structurés",
    image: "/besoin-projet.png",
  },
  gerer: {
    title: "Gérer une situation",
    description: "Trouvez des outils pour gérer les situations délicates",
    image: "/besoin-gerer.png",
  },
  competences: {
    title: "Monter en compétences",
    description: "Développez vos connaissances et votre expertise",
    image: "/besoin-competences.png",
  },
};

type CategoryGroup = {
  groupKey: string;
  groupLabel: string;
  items: { value: string; label: string }[];
};

function humanizeSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function buildCategoryGroups(categoryKeys: string[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  categoryKeys.forEach((fullKey) => {
    const [group, sub] = fullKey.split("/");
    if (!group) return;

    if (!map.has(group)) {
      map.set(group, {
        groupKey: group,
        groupLabel: humanizeSlug(group),
        items: [],
      });
    }

    if (sub) {
      map.get(group)!.items.push({
        value: fullKey,
        label: humanizeSlug(sub),
      });
    } else {
      map.get(group)!.items.push({
        value: fullKey,
        label: humanizeSlug(group),
      });
    }
  });

  const groups = Array.from(map.values()).sort((a, b) =>
    a.groupLabel.localeCompare(b.groupLabel)
  );
  groups.forEach((g) => g.items.sort((a, b) => a.label.localeCompare(b.label)));
  return groups;
}

export default function NeedCategories() {
  const params = useParams();
  const needId = params.need as NeedType;

  if (!needId || !(needId in NEED_INFO)) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Besoin non trouvé</p>
      </div>
    );
  }

  const needInfo = NEED_INFO[needId];

  // ✅ Catégories réelles depuis la DB (pas de filtre profil ici)
  const { data: categoryKeys = [], isLoading } =
    trpc.resources.listCategories.useQuery(undefined, { staleTime: 60_000 });

  const groups = useMemo(
    () => buildCategoryGroups(categoryKeys),
    [categoryKeys]
  );

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: needInfo.title },
        ]}
      />

      {/* Hero Section */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="container max-w-5xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-48 h-48 rounded-lg overflow-hidden shadow-elegant flex-shrink-0">
              <img
                src={needInfo.image}
                alt={needInfo.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-bold mb-4">{needInfo.title}</h1>
              <p className="text-xl text-muted-foreground">
                {needInfo.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">
            Choisissez une catégorie
          </h2>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : groups.length === 0 ? (
            <p className="text-center text-muted-foreground">
              Aucune catégorie disponible pour le moment.
            </p>
          ) : (
            <div className="space-y-10">
              {groups.map((g) => (
                <div key={g.groupKey}>
                  <h3 className="text-xl font-semibold mb-4">
                    {g.groupLabel}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {g.items.map((it) => (
                      <Link
                        key={it.value}
                        href={`/ressources?categorie=${encodeURIComponent(
                          it.value
                        )}`}
                      >
                        <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                          <CardContent className="p-6 flex items-center justify-between gap-4">
                            <h4 className="font-semibold text-lg flex-1">
                              {it.label}
                            </h4>
                            <ArrowRight className="h-5 w-5 text-primary group-hover:translate-x-1 transition-transform" />
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <Link href="/ressources">
              <button className="text-primary hover:underline">
                Voir toutes les ressources →
              </button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
