import { useEffect, useMemo, useState } from "react";

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

import { FavoriteButton } from "@/components/FavoriteButton";
import { useFilterPreferences } from "@/hooks/useFilterPreferences";
import { readingLabel } from "@/lib/resourcePolicy";
import { AGE_RANGES, DURATIONS, RESOURCE_TYPES } from "@shared/resourceMeta";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
type ProfileFilter = "" | ProfileType;

function normalizeProfileFilter(value: string | null): ProfileFilter {
  if (
    value === "animateur" ||
    value === "formateur" ||
    value === "directeur" ||
    value === "stagiaire_bafa"
  ) {
    return value;
  }

  return "";
}

type CategoryGroup = {
  groupLabel: string;
  items: { value: string; label: string }[];
};

const PAGE_SIZE = 24;

function humanizeCategoryLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

function slugifySegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, "-")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function normalizeCategoryFilter(value: string | null): string {
  if (!value) return "";

  return decodeURIComponent(value)
    .split("/")
    .map((part) => slugifySegment(part))
    .filter(Boolean)
    .join("/");
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
  const [location, navigate] = useLocation();

  const categoryFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search || "");
    return normalizeCategoryFilter(params.get("categorie"));
  }, [location]);

  const searchFromUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search || "");
    const raw = params.get("q");
    return raw ? decodeURIComponent(raw) : "";
  }, [location]);

  const profileFromUrl = useMemo<ProfileFilter>(() => {
    const params = new URLSearchParams(window.location.search || "");
    return normalizeProfileFilter(params.get("profil"));
  }, [location]);

  const [search, setSearch] = useState(searchFromUrl || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchFromUrl || "");
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(categoryFromUrl || "");
  const [selectedProfile, setSelectedProfile] = useState<ProfileFilter>(profileFromUrl);
  const [page, setPage] = useState(1);



  // IMPORTANT :
  // le catalogue doit démarrer en mode neutre :
  // aucun profil sélectionné par défaut.
  // Donc on ne force jamais le profil du compte connecté ici.

  useEffect(() => {
    setSelectedCategory(categoryFromUrl || "");
    setPage(1);
  }, [categoryFromUrl]);

  useEffect(() => {
    setSearch(searchFromUrl || "");
    setDebouncedSearch(searchFromUrl || "");
    setPage(1);
  }, [searchFromUrl]);

  useEffect(() => {
    setSelectedProfile(profileFromUrl);
    setPage(1);
  }, [profileFromUrl]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [search]);


  const { data: categories = [] } = trpc.resources.listCategories.useQuery(
    {
      profileType: selectedProfile === "" ? undefined : selectedProfile,
    },
    {
      staleTime: 60_000,
    }
  );

  const categoryGroups = useMemo(() => {
    const normalizedCategories = categories.map((category) =>
      normalizeCategoryFilter(category)
    );

    const baseGroups = buildCategoryGroups(normalizedCategories);

    if (!selectedCategory) {
      return baseGroups;
    }

    const alreadyExists = normalizedCategories.includes(selectedCategory);
    if (alreadyExists) {
      return baseGroups;
    }

    const [group, sub] = selectedCategory.split("/");
    if (!group || !sub) {
      return baseGroups;
    }

    const groupLabel = humanizeCategoryLabel(group);
    const itemLabel = humanizeCategoryLabel(sub);

    const existingGroup = baseGroups.find((g) => g.groupLabel === groupLabel);

    if (existingGroup) {
      const itemExists = existingGroup.items.some(
        (item) => item.value === selectedCategory
      );

      if (!itemExists) {
        existingGroup.items = [...existingGroup.items, { value: selectedCategory, label: itemLabel }]
          .sort((a, b) => a.label.localeCompare(b.label));
      }

      return [...baseGroups].sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
    }

    return [
      ...baseGroups,
      {
        groupLabel,
        items: [{ value: selectedCategory, label: itemLabel }],
      },
    ].sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  }, [categories, selectedCategory]);

  const { data: themes = [] } = trpc.themes.list.useQuery(undefined, {
    staleTime: 60_000,
  });

  const { data: paginatedData, isLoading } = trpc.resources.listPaginated.useQuery({
    search: debouncedSearch.trim() || undefined,
    themeIds: selectedThemes.length > 0 ? selectedThemes : undefined,
    type: selectedType || undefined,
    ageRange: selectedAgeRange || undefined,
    duration: selectedDuration || undefined,
    category: selectedCategory || undefined,
    profileType: selectedProfile === "" ? undefined : selectedProfile,
    page,
    limit: PAGE_SIZE,
  });

  const resources = paginatedData?.items ?? [];
  const pagination = paginatedData?.pagination;

  const { savePreferences, resetPreferences } = useFilterPreferences();

  const defaultProfile: ProfileFilter = "";

  const syncCatalogueUrl = ({
    nextSearch,
    nextProfile,
    nextCategory,
  }: {
    nextSearch: string;
    nextProfile: ProfileFilter;
    nextCategory: string;
  }) => {
    const params = new URLSearchParams();

    const trimmedSearch = nextSearch.trim();

    if (trimmedSearch) {
      params.set("q", trimmedSearch);
    }

    if (nextProfile) {
      params.set("profil", nextProfile);
    }

    if (nextCategory) {
      params.set("categorie", nextCategory);
    }

    const query = params.toString();
    navigate(query ? `/resources?${query}` : "/resources", { replace: true });
  };

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSelectedThemes([]);
    setSelectedType("");
    setSelectedAgeRange("");
    setSelectedDuration("");
    setSelectedCategory("");
    setSelectedProfile(defaultProfile);
    setPage(1);
    resetPreferences();
    syncCatalogueUrl({
      nextSearch: "",
      nextProfile: defaultProfile,
      nextCategory: "",
    });
  };

  const hasFilters =
    !!search ||
    selectedThemes.length > 0 ||
    !!selectedType ||
    !!selectedAgeRange ||
    !!selectedDuration ||
    !!selectedCategory ||
    selectedProfile !== defaultProfile;

  function getResourceThumbnail(resource: any): string {
    const accessLevel = (resource?.accessLevel ?? "PUBLIC") as
      | "PUBLIC"
      | "INTERNAL_IFAC"
      | "PREMIUM";

    if (accessLevel === "PREMIUM") {
      return "/thumbnails/default-document.png";
    }

    const thumbnailUrl = resource?.thumbnailUrl;

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
  const paginationBlock =
    pagination && pagination.totalPages > 1 ? (
      <div className="flex flex-col items-center gap-3 pt-2">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} sur {pagination.totalPages} — {pagination.total} ressource
          {pagination.total > 1 ? "s" : ""}
        </p>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.hasPreviousPage}
          >
            Précédent
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              setPage((current) =>
                pagination.totalPages > 0
                  ? Math.min(pagination.totalPages, current + 1)
                  : current
              )
            }
            disabled={!pagination.hasNextPage}
          >
            Suivant
          </Button>
        </div>
      </div>
    ) : null;
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ressources" }]} />

          <h1 className="text-4xl font-bold">Catalogue de ressources</h1>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Filtres</CardTitle>
              <CardDescription>
                Affine rapidement le catalogue avec une recherche et des filtres compacts.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Recherche
                  </label>
                  <Input
                    placeholder="Rechercher…"
                    value={search}
                    onChange={(e) => {
                      const nextSearch = e.target.value;
                      setSearch(nextSearch);
                      setPage(1);
                      syncCatalogueUrl({
                        nextSearch,
                        nextProfile: selectedProfile,
                        nextCategory: selectedCategory,
                      });
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Profil
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedProfile}
                      onChange={(e) => {
                        const nextProfile = normalizeProfileFilter(e.target.value);
                        setSelectedProfile(nextProfile);
                        setPage(1);
                        syncCatalogueUrl({
                          nextSearch: search,
                          nextProfile,
                          nextCategory: selectedCategory,
                        });
                      }}
                    >
                      <option value="">Tous les profils</option>
                      <option value="animateur">{PROFILE_LABELS.animateur}</option>
                      <option value="directeur">{PROFILE_LABELS.directeur}</option>
                      <option value="formateur">{PROFILE_LABELS.formateur}</option>
                      <option value="stagiaire_bafa">{PROFILE_LABELS.stagiaire_bafa}</option>
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Thème
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedThemes[0] ? String(selectedThemes[0]) : ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setSelectedThemes(value ? [Number(value)] : []);
                        setPage(1);
                      }}
                    >
                      <option value="">Tous les thèmes</option>

                      {themes.map((theme: any) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Type
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedType}
                      onChange={(e) => {
                        setSelectedType(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Tous les types</option>

                      {RESOURCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Tranche d’âge
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedAgeRange}
                      onChange={(e) => {
                        setSelectedAgeRange(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Toutes les tranches d’âge</option>

                      {AGE_RANGES.map((ageRange) => (
                        <option key={ageRange} value={ageRange}>
                          {ageRange}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Durée
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedDuration}
                      onChange={(e) => {
                        setSelectedDuration(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">Toutes les durées</option>

                      {DURATIONS.map((duration) => (
                        <option key={duration} value={duration}>
                          {duration}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid gap-2">
                    <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Catégorie
                    </label>

                    <select
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                      value={selectedCategory}
                      onChange={(e) => {
                        const nextCategory = normalizeCategoryFilter(e.target.value);
                        setSelectedCategory(nextCategory);
                        setPage(1);
                        syncCatalogueUrl({
                          nextSearch: search,
                          nextProfile: selectedProfile,
                          nextCategory,
                        });
                      }}
                    >
                      <option value="">Toutes les catégories</option>

                      {categoryGroups.map((g) => (
                        <optgroup key={g.groupLabel} label={g.groupLabel}>
                          {g.items.map((it) => (
                            <option key={it.value} value={it.value}>
                              {it.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
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
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <p>Chargement…</p>
          ) : (
            <>
              {paginationBlock}
              {resources.length === 0 ? (
                <p className="text-muted-foreground">Aucune ressource trouvée.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {resources.map(renderResourceCard)}
                </div>
              )}

                            {paginationBlock}
            </>
          )}
        </div>
      </main>
    </div>
  );
}