import { useEffect, useMemo, useRef, useState } from "react";

import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Download, Globe, Lock, RotateCcw, Save } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFilterPreferences } from "@/hooks/useFilterPreferences";
import { readingLabel } from "@/lib/resourcePolicy";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
type ProfileFilter = "" | ProfileType;

type CategoryGroup = {
  groupLabel: string;
  items: { value: string; label: string }[];
};

function humanizeCategoryLabel(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function buildCategoryGroups(categories: string[]): CategoryGroup[] {
  const map = new Map<string, CategoryGroup>();

  categories.forEach((fullKey) => {
    const [group, sub] = fullKey.split("/");

    if (!group || !sub) return;

    if (!map.has(group)) {
      map.set(group, {
        groupLabel: humanizeCategoryLabel(group),
        items: [],
      });
    }

    map.get(group)!.items.push({
      value: fullKey,
      label: humanizeCategoryLabel(sub),
    });
  });

  return Array.from(map.values())
    .map((g) => ({
      ...g,
      items: g.items.sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
}

const PROFILE_LABELS: Record<ProfileType, string> = {
  animateur: "Animateur·rice",
  formateur: "Formateur·rice",
  directeur: "Directeur·rice",
  stagiaire_bafa: "Stagiaire BAFA",
};

export default function ResourcesReorganized() {
  const [search, setSearch] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  // Nouveau: filtre Profil (pour voir Stagiaire BAFA, etc.)
  const [selectedProfile, setSelectedProfile] = useState<ProfileFilter>("");

  const { user } = useAuth();
  const { data: userProfile } = trpc.profiles.getUserProfile.useQuery(undefined, {
    enabled: !!user,
  });

  // Initialisation pro: si l’utilisateur a un profil, on le sélectionne par défaut,
  // mais l’utilisateur peut ensuite changer manuellement.
  const didInitProfile = useRef(false);
  useEffect(() => {
    if (didInitProfile.current) return;
    const p = (userProfile?.profileType ?? "") as ProfileFilter;
    if (p) {
      setSelectedProfile(p);
      didInitProfile.current = true;
    }
  }, [userProfile]);

  const [location] = useLocation();
  const utils = trpc.useUtils();

  const categoryFromUrl = useMemo(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const raw = params.get("categorie");
    return raw ? decodeURIComponent(raw) : undefined;
  }, [location]);

  useEffect(() => {
    setSelectedCategory(categoryFromUrl || "");
    utils.resources.list.invalidate();
  }, [categoryFromUrl, utils]);

  const { data: categories = [] } = trpc.resources.listCategories.useQuery(undefined, {
    staleTime: 60_000,
  });

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery({
    search: search || undefined,
    themeIds: selectedThemes.length > 0 ? selectedThemes : undefined,
    type: selectedType || undefined,
    ageRange: selectedAgeRange || undefined,
    duration: selectedDuration || undefined,
    category: selectedCategory || undefined,
    // IMPORTANT: on utilise le filtre choisi (si vide => pas de filtre profil)
    profileType: selectedProfile || undefined,
  });

  const { savePreferences, resetPreferences } = useFilterPreferences();

  const defaultProfile: ProfileFilter = (userProfile?.profileType ?? "") as ProfileFilter;

  const clearFilters = () => {
    setSearch("");
    setSelectedThemes([]);
    setSelectedType("");
    setSelectedAgeRange("");
    setSelectedDuration("");
    setSelectedCategory("");
    setSelectedProfile(defaultProfile);
    resetPreferences();
  };

  const hasFilters =
    !!search ||
    selectedThemes.length > 0 ||
    !!selectedType ||
    !!selectedAgeRange ||
    !!selectedDuration ||
    !!selectedCategory ||
    selectedProfile !== defaultProfile;

  /* =====================================================
     VIGNETTES – VERSION SIMPLE ET ROBUSTE
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

    // ✅ On n’utilise JAMAIS fileUrl pour fabriquer une vignette
    if (typeof thumbnailUrl === "string" && thumbnailUrl.trim() !== "") {
      return thumbnailUrl;
    }

    return "/thumbnails/default-document.png";
  }

  function renderResourceCard(resource: any) {
    const thumbSrc = getResourceThumbnail(resource);

    return (
      <Link key={resource.id} href={`/resources/${resource.id}`}>
        <Card className="h-full hover:shadow-elegant transition-all duration-300 cursor-pointer group">
          <div className="aspect-video w-full overflow-hidden rounded-t-lg bg-muted">
            <img
              src={thumbSrc}
              alt={resource.title || "Ressource"}
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

          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg line-clamp-2">{resource.title}</CardTitle>

              {resource.visibility === "INTERNAL_IFAC" ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <CardDescription className="line-clamp-2">{resource.summary}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resource.type && <Badge variant="secondary">{resource.type}</Badge>}
              {resource.ageRange && <Badge variant="outline">{resource.ageRange}</Badge>}
              {resource.duration && <Badge variant="outline">{resource.duration}</Badge>}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {readingLabel({
                visibility: resource.visibility,
                accessLevel: resource.accessLevel,
              })}
            </span>

            <div className="flex gap-2">
              <FavoriteButton resourceId={resource.id} size="sm" />

              {(resource as any).hasFile && (resource as any).canOpen && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(`/api/resources/download/${resource.id}`, "_blank");
                  }}
                  title="Télécharger"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </Link>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ressources" }]} />

          <h1 className="text-4xl font-bold">Catalogue de ressources</h1>

          <Card>
            <CardHeader>
              <CardTitle>Filtres</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />

              {/* Nouveau: Profil */}
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">Profil</label>

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value as ProfileFilter)}
                >
                  <option value="">Tous les profils</option>
                  <option value="animateur">{PROFILE_LABELS.animateur}</option>
                  <option value="directeur">{PROFILE_LABELS.directeur}</option>
                  <option value="formateur">{PROFILE_LABELS.formateur}</option>
                  <option value="stagiaire_bafa">{PROFILE_LABELS.stagiaire_bafa}</option>
                </select>

                <p className="text-xs text-muted-foreground">
                  Astuce : pour vérifier l’import “Stagiaire BAFA”, sélectionne ce profil ici.
                </p>
              </div>

              {/* Catégorie */}
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground">Catégorie</label>

                <select
                  className="h-10 rounded-md border bg-background px-3 text-sm"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">Toutes les catégories</option>

                  {buildCategoryGroups(categories).map((g) => (
                    <optgroup key={g.groupLabel} label={g.groupLabel}>
                      {g.items.map((it) => (
                        <option key={it.value} value={it.value}>
                          {it.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>

                <p className="text-xs text-muted-foreground">
                  Astuce : les catégories sont regroupées par grande famille.
                </p>
              </div>

              <div className="flex gap-2">
                {hasFilters && (
                  <Button variant="outline" onClick={clearFilters}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Réinitialiser
                  </Button>
                )}

                <Button
                  variant="secondary"
                  onClick={() =>
                    savePreferences({
                      search,
                      selectedThemes,
                      selectedType,
                      selectedAgeRange,
                      selectedDuration,
                      selectedCategory,
                    })
                  }
                >
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <p>Chargement…</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources.map(renderResourceCard)}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
