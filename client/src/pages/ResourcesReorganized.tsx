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
import { useAuth } from "@/_core/hooks/useAuth";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFilterPreferences } from "@/hooks/useFilterPreferences";

export default function ResourcesReorganized() {
  const [search, setSearch] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<number[]>([]);
  const [selectedType, setSelectedType] = useState("");
  const [selectedAgeRange, setSelectedAgeRange] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { user } = useAuth();
  const { data: userProfile } = trpc.profiles.getUserProfile.useQuery(
    undefined,
    { enabled: !!user }
  );

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

  const { data: resources = [], isLoading } = trpc.resources.list.useQuery({
    search: search || undefined,
    themeIds: selectedThemes.length > 0 ? selectedThemes : undefined,
    type: selectedType || undefined,
    ageRange: selectedAgeRange || undefined,
    duration: selectedDuration || undefined,
    category: selectedCategory || undefined,
    profileType: userProfile?.profileType as any,
  });

  const { savePreferences, resetPreferences } = useFilterPreferences();

  const clearFilters = () => {
    setSearch("");
    setSelectedThemes([]);
    setSelectedType("");
    setSelectedAgeRange("");
    setSelectedDuration("");
    setSelectedCategory("");
    resetPreferences();
  };

  const hasFilters =
    !!search ||
    selectedThemes.length > 0 ||
    !!selectedType ||
    !!selectedAgeRange ||
    !!selectedDuration ||
    !!selectedCategory;

  /* =====================================================
     VIGNETTES – VERSION SIMPLE ET ROBUSTE
     ===================================================== */

  function getResourceThumbnail(resource: any): string {
    // 1) Image définie explicitement (si un jour tu en remets)
    if (
      resource?.thumbnailUrl &&
      typeof resource.thumbnailUrl === "string" &&
      !resource.thumbnailUrl.includes("/thumbnails/profile-")
    ) {
      return resource.thumbnailUrl;
    }

    // 2) Vignette générée automatiquement depuis le PDF
    if (
      resource?.fileUrl &&
      typeof resource.fileUrl === "string" &&
      resource.fileUrl.startsWith("/imported/") &&
      resource.fileUrl.toLowerCase().endsWith(".pdf")
    ) {
      return resource.fileUrl
        .replace("/imported/", "/imported_thumbs/")
        .replace(/\.pdf$/i, ".png");
    }

    // 3) Fallback neutre
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
              <CardTitle className="text-lg line-clamp-2">
                {resource.title}
              </CardTitle>

              {resource.visibility === "INTERNAL_IFAC" ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Globe className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <CardDescription className="line-clamp-2">
              {resource.summary}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-wrap gap-2">
              {resource.type && (
                <Badge variant="secondary">{resource.type}</Badge>
              )}
              {resource.ageRange && (
                <Badge variant="outline">{resource.ageRange}</Badge>
              )}
              {resource.duration && (
                <Badge variant="outline">{resource.duration}</Badge>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {resource.visibility === "PUBLIC" ? "Public" : "Interne IFAC"}
            </span>

            <div className="flex gap-2">
              <FavoriteButton resourceId={resource.id} size="sm" />

              {resource.fileUrl && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(resource.fileUrl, "_blank");
                  }}
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
              <Input
                placeholder="Rechercher…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

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
