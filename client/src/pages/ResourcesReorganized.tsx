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
import {
  Download,
  Eye,
  Globe,
  Lock,
  RotateCcw,
  Save,
  Search,
  SlidersHorizontal,
} from "lucide-react";
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

  const selectedThemeLabel = useMemo(() => {
    const themeId = selectedThemes[0];
    if (!themeId) return "";

    const theme = themes.find((item: any) => item.id === themeId);
    return theme?.name ?? "";
  }, [themes, selectedThemes]);

  const activeFilterBadges = useMemo(() => {
    const badges: string[] = [];

    if (search.trim()) {
      badges.push(`Recherche : ${search.trim()}`);
    }

    if (selectedProfile) {
      badges.push(`Profil : ${PROFILE_LABELS[selectedProfile]}`);
    }

    if (selectedThemeLabel) {
      badges.push(`Thème : ${selectedThemeLabel}`);
    }

    if (selectedType) {
      badges.push(`Type : ${selectedType}`);
    }

    if (selectedAgeRange) {
      badges.push(`Âge : ${selectedAgeRange}`);
    }

    if (selectedDuration) {
      badges.push(`Durée : ${selectedDuration}`);
    }

    if (selectedCategory) {
      badges.push(
        `Catégorie : ${selectedCategory
          .split("/")
          .map((part) => humanizeCategoryLabel(part))
          .join(" / ")}`
      );
    }

    return badges;
  }, [
    search,
    selectedProfile,
    selectedThemeLabel,
    selectedType,
    selectedAgeRange,
    selectedDuration,
    selectedCategory,
  ]);

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

    const tones = [
      {
        shell: "from-rose-50/90 via-white to-orange-50/80",
        media: "from-rose-100 via-orange-50 to-amber-100",
        chip: "bg-rose-100/95 text-rose-700 border-rose-200",
        accent: "bg-rose-500",
        cta: "text-rose-600 group-hover:text-rose-700",
      },
      {
        shell: "from-sky-50/90 via-white to-indigo-50/80",
        media: "from-sky-100 via-blue-50 to-indigo-100",
        chip: "bg-sky-100/95 text-sky-700 border-sky-200",
        accent: "bg-sky-500",
        cta: "text-sky-600 group-hover:text-sky-700",
      },
      {
        shell: "from-emerald-50/90 via-white to-teal-50/80",
        media: "from-emerald-100 via-teal-50 to-cyan-100",
        chip: "bg-emerald-100/95 text-emerald-700 border-emerald-200",
        accent: "bg-emerald-500",
        cta: "text-emerald-600 group-hover:text-emerald-700",
      },
      {
        shell: "from-violet-50/90 via-white to-fuchsia-50/80",
        media: "from-violet-100 via-fuchsia-50 to-pink-100",
        chip: "bg-violet-100/95 text-violet-700 border-violet-200",
        accent: "bg-violet-500",
        cta: "text-violet-600 group-hover:text-violet-700",
      },
    ];

    const tone = tones[Math.abs(Number(resource.id ?? 0)) % tones.length];

    return (
      <Link
  key={resource.id}
  href={`/resources/${resource.id}`}
  className="block focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary rounded-[28px]"
>
        <Card className="group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_12px_32px_rgba(15,23,42,0.07)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] hover:border-slate-300 hover:shadow-[0_35px_90px_rgba(15,23,42,0.2)]">
          <div className="absolute inset-0 bg-white" />
          <div className={`absolute inset-x-0 top-0 h-[190px] bg-gradient-to-br ${tone.shell} opacity-95`} />
          <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.98),_transparent_72%)] opacity-95" />
          <div className={`absolute left-0 top-0 h-full w-1.5 ${tone.accent} opacity-90`} />

          <div className="relative p-2 pb-0">
            <div
              className={`relative overflow-hidden rounded-[22px] bg-gradient-to-br ${tone.media} p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]`}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.96),_transparent_58%)]" />
              <div className="absolute inset-x-6 bottom-0 h-14 rounded-full bg-black/10 blur-2xl" />

              {resource.type && (
                <div className="absolute left-3 top-3 z-20">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] shadow-sm backdrop-blur-sm ${tone.chip}`}
                  >
                    {resource.type}
                  </span>
                </div>
              )}

              <div className="relative z-10 aspect-[16/10] overflow-hidden rounded-[14px] bg-white shadow-sm">
                
                {/* Background intelligent */}
                <img
                src={thumbSrc}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-3xl scale-125 opacity-10 saturate-150"
              />
                {/* Image principale */}
                <img
                  src={thumbSrc}
                  alt={resource.title || "Ressource"}
                  className="relative h-full w-full object-contain p-2 transition-all duration-500 ease-out group-hover:scale-[1.08] group-hover:brightness-105"
                  loading="lazy"
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (img.dataset.fallbackApplied === "1") return;
                    img.dataset.fallbackApplied = "1";
                    img.src = "/thumbnails/default-document.png";
                  }}
                />
              </div>
            </div>
          </div>

          <CardHeader className="relative space-y-1 px-2.5 pb-0 pt-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {resource.ageRange && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-2 py-0 text-[10px] text-slate-700 shadow-sm"
                  >
                    {resource.ageRange}
                  </Badge>
                )}
                {resource.duration && (
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-200 bg-white px-2 py-0 text-[10px] text-slate-700 shadow-sm"
                  >
                    {resource.duration}
                  </Badge>
                )}
                <Badge className="rounded-full bg-slate-900 px-2 py-0 text-[10px] text-white shadow-sm">
                  {readingLabel({
                    visibility: resource.visibility,
                    accessLevel: resource.accessLevel,
                  })}
                </Badge>
              </div>

              <div className="mt-0.5 flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm">
                {resource.visibility === "INTERNAL_IFAC" ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Globe className="h-3 w-3" />
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <CardTitle className="line-clamp-2 text-[15px] font-semibold leading-tight text-slate-900">
                {resource.title}
              </CardTitle>

              <p className="line-clamp-1 text-[10px] text-slate-400">
                {resource.profileType ? `${resource.profileType} · ` : ""}
                {resource.type || "document"}
              </p>

              <CardDescription className="line-clamp-1 text-[11px] leading-tight text-slate-600">
                {resource.summary}
              </CardDescription>
            </div>
          </CardHeader>

          <CardFooter className="relative mt-2 px-2.5 pb-2.5 pt-1.5">
            <div className="flex w-full items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={`text-[13px] font-semibold ${tone.cta} transition-all duration-300 group-hover:translate-x-1`}
                >
                  Voir →
                </span>

                <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-[12px] font-semibold text-slate-700 border border-slate-200 shadow-sm">
  <Eye className="h-4 w-4 opacity-70" />
  <span>
    {Number(resource.viewCount ?? 0)} vue{Number(resource.viewCount ?? 0) > 1 ? "s" : ""}
  </span>
</div>
              </div>

              <div className="flex items-center gap-1">
                <FavoriteButton resourceId={resource.id} size="sm" />

                {(resource as any).hasFile && (resource as any).canOpen && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10 min-w-[40px] rounded-lg border border-slate-300 bg-slate-100 px-0 shadow-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(`/api/resources/download/${resource.id}`, "_blank");
                    }}
                    title="Télécharger"
                  >
                    <Download className="h-6 w-6 text-slate-700" />
                  </Button>
                )}
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    );
  }
const paginationBlock =
  pagination && pagination.totalPages > 1 ? (
    <div className="flex w-full flex-col items-center gap-4 pt-6 pb-2">
      <div className="text-sm text-muted-foreground">
        Page <span className="font-semibold text-foreground">{pagination.page}</span> sur{" "}
        <span className="font-semibold text-foreground">{pagination.totalPages}</span>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-background/80 p-2 shadow-sm backdrop-blur-sm">
        <Button
          variant="ghost"
          className="rounded-xl px-4"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={!pagination.hasPreviousPage}
        >
          ← Précédent
        </Button>

        <div className="flex items-center gap-1">
          {Array.from({ length: pagination.totalPages })
            .slice(0, 5)
            .map((_, i) => {
              const pageNumber = i + 1;
              const isActive = pageNumber === pagination.page;

              return (
                <button
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-primary text-white shadow-md"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
        </div>

        <Button
          variant="ghost"
          className="rounded-xl px-4"
          onClick={() =>
            setPage((current) =>
              pagination.totalPages > 0
                ? Math.min(pagination.totalPages, current + 1)
                : current
            )
          }
          disabled={!pagination.hasNextPage}
        >
          Suivant →
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8 md:py-10">
        <div className="container space-y-8">
          <Breadcrumb items={[{ label: "Ressources" }]} />

          <section className="relative overflow-hidden rounded-[32px] border border-border/50 bg-background/70 px-6 py-8 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px] md:px-8 md:py-9">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_transparent_40%),linear-gradient(135deg,rgba(59,130,246,0.08),rgba(99,102,241,0.04),rgba(255,255,255,0.72))]" />
            <div className="absolute -right-16 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-200/30 blur-3xl" />

            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-3xl space-y-4">
                <Badge className="w-fit rounded-full bg-primary/12 px-3 py-1 text-primary shadow-sm">
                  Catalogue ifac
                </Badge>

                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl xl:text-5xl">
                    Catalogue de ressources
                  </h1>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                    Explorez les ressources pédagogiques, filtrez rapidement les contenus utiles
                    et retrouvez plus facilement ce qui vous intéresse.
                  </p>
                </div>
              </div>

              {!isLoading && pagination ? (
                <div className="flex min-w-[170px] flex-col items-start gap-2 rounded-[24px] border border-border/50 bg-white/80 px-5 py-4 shadow-sm backdrop-blur-sm sm:items-end">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Résultat actuel
                  </span>
                  <span className="text-3xl font-bold leading-none text-primary">
                    {pagination.total}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ressource{pagination.total > 1 ? "s" : ""}
                  </span>
                </div>
              ) : null}
            </div>
          </section>

          <Card className="overflow-hidden rounded-[32px] border border-border/50 bg-background/70 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-[6px]">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.92),_transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.72),rgba(255,255,255,0.52))]" />
            <CardHeader className="relative pb-4 md:pb-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>

                  <div className="space-y-1">
                    <CardTitle className="text-xl tracking-tight">Filtres</CardTitle>
                    <CardDescription className="max-w-2xl">
                      Affinez rapidement le catalogue avec une recherche et des filtres plus
                      lisibles.
                    </CardDescription>
                  </div>
                </div>

                {hasFilters ? (
                  <Badge
                    variant="outline"
                    className="w-fit rounded-full border-primary/20 bg-primary/10 px-3 py-1 text-primary"
                  >
                    {activeFilterBadges.length} filtre
                    {activeFilterBadges.length > 1 ? "s" : ""} actif
                    {activeFilterBadges.length > 1 ? "s" : ""}
                  </Badge>
                ) : (
                  <Badge className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                    Vue complète
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="relative space-y-6">
              <div className="grid gap-5">
                <div className="grid gap-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Recherche
                  </label>

                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="h-11 rounded-2xl border-border/50 bg-white/80 pl-10 shadow-sm"
                      placeholder="Rechercher une ressource, un mot-clé, une idée d’activité…"
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
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div className="grid gap-2">
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Profil
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Thème
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Type
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Tranche d’âge
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Durée
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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
                    <label className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Catégorie
                    </label>

                    <select
                      className="h-11 rounded-2xl border border-border/50 bg-white/80 px-3 text-sm shadow-sm"
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

                {activeFilterBadges.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Filtres actifs
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {activeFilterBadges.map((label) => (
                        <Badge
                          key={label}
                          variant="outline"
                          className="rounded-full border-border/50 bg-white/80 px-3 py-1"
                        >
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  {hasFilters && (
                    <Button variant="outline" className="rounded-2xl" onClick={clearFilters}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Réinitialiser
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    className="rounded-2xl"
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
                    <Save className="mr-2 h-4 w-4" />
                    Sauvegarder
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-5 rounded-[32px] border border-border/50 bg-background/55 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] backdrop-blur-[4px] md:p-6 lg:p-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-2">
                <Badge className="w-fit rounded-full bg-primary/10 px-3 py-1 text-primary">
                  Catalogue
                </Badge>

                <div className="space-y-1">
                  <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
                    Résultats
                  </h2>
                  <p className="text-sm text-muted-foreground md:text-base">
                    {isLoading
                      ? "Chargement du catalogue…"
                      : pagination
                        ? `${pagination.total} ressource${pagination.total > 1 ? "s" : ""} trouvée${pagination.total > 1 ? "s" : ""}`
                        : "Résultats du catalogue"}
                  </p>
                </div>
              </div>

              {!isLoading && paginationBlock}
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden rounded-[28px] border-border/60">
                    <div className="aspect-video animate-pulse bg-muted" />
                    <CardHeader className="space-y-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                      <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
                      <div className="h-4 w-full animate-pulse rounded bg-muted" />
                      <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
                    </CardHeader>
                    <CardContent>
                      <div className="h-10 animate-pulse rounded-xl bg-muted" />
                    </CardContent>
                    <CardFooter>
                      <div className="h-8 w-full animate-pulse rounded bg-muted" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : resources.length === 0 ? (
              <Card className="rounded-[28px] border-dashed border-border/70 bg-muted/20">
                <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold">Aucune ressource trouvée</h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                      Essayez d’élargir la recherche ou de réinitialiser les filtres pour
                      afficher davantage de contenus.
                    </p>
                  </div>

                  {hasFilters && (
                    <Button variant="outline" className="rounded-2xl" onClick={clearFilters}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Réinitialiser les filtres
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {resources.map(renderResourceCard)}
                </div>

                {paginationBlock}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}