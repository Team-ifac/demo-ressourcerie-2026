import { useMemo } from "react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

type CanonProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa" | "decouvrir";

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

function humanizeCategoryLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function CategoryResources() {
  const params = useParams();

  const profileId = normalizeProfileSlug(params.profile as any);
  const groupKey = params.key ? String(params.key) : "";

  if (!profileId || !groupKey) {
    return (
      <div className="container py-12">
        <p className="text-center text-muted-foreground">Catégorie introuvable</p>
      </div>
    );
  }

  const dbProfileType = profileId === "decouvrir" ? undefined : (profileId as any);

  const { data: categoryKeys = [], isLoading } = trpc.resources.listCategories.useQuery(
    dbProfileType ? { profileType: dbProfileType } : undefined,
    { staleTime: 60_000 }
  );

  const subCategories = useMemo(() => {
    // On ne garde que les keys qui commencent par "<groupKey>/..."
    const prefix = `${groupKey}/`;

    const subs = new Set<string>();

    for (const key of categoryKeys) {
      if (!key || typeof key !== "string") continue;

      if (key === groupKey) {
        // cas rare: catégorie sans sous-catégorie
        continue;
      }

      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        // rest = "bilan-et-evaluation" ou "a/b/c" -> on ne prend que le 1er niveau
        const first = rest.split("/")[0];
        if (first) subs.add(first);
      }
    }

    return Array.from(subs).sort((a, b) => a.localeCompare(b));
  }, [categoryKeys, groupKey]);

  return (
    <div className="min-h-screen">
      <Breadcrumb
        items={[
          { label: "Accueil", href: "/" },
          { label: "Profils", href: "/profils" },
          { label: humanizeCategoryLabel(groupKey) },
        ]}
      />

      <section className="py-12 px-4">
        <div className="container max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">
            {humanizeCategoryLabel(groupKey)}
          </h1>

          {isLoading ? (
            <p className="text-center text-muted-foreground">Chargement…</p>
          ) : subCategories.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                Pas de sous-catégories trouvées. Vous pouvez accéder directement au catalogue filtré.
              </p>

              {/* fallback: filtre direct sur la catégorie "groupKey" si jamais tu en as en base */}
              <Link href={`/ressources?categorie=${encodeURIComponent(groupKey)}`}>
                <button className="text-primary hover:underline">
                  Ouvrir le catalogue filtré →
                </button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">Choisissez une sous-catégorie</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subCategories.map((sub) => {
                  const fullKey = `${groupKey}/${sub}`;
                  return (
                    <Link
                      key={sub}
                      href={`/ressources?categorie=${encodeURIComponent(fullKey)}`}
                    >
                      <Card className="h-full hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                        <CardContent className="p-6 flex items-center justify-between gap-4">
                          <h3 className="font-semibold text-lg flex-1">
                            {humanizeCategoryLabel(sub)}
                          </h3>
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
