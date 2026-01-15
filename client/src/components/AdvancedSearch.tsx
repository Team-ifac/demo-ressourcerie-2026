import { useState, useEffect, useRef } from "react";
import { Search, X, Tag, BookOpen, Layers } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SearchSuggestion {
  type: "keyword" | "tag" | "theme" | "category";
  value: string;
  label: string;
}

export function AdvancedSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  // Récupérer les tags et thématiques pour les suggestions
  const { data: tags } = trpc.tags.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();

  // Catégories prédéfinies
  const categories = [
    "Jeux et activités ludiques",
    "Outils pédagogiques",
    "Guides pratiques",
    "Fiches techniques",
    "Supports de formation",
    "Recettes de cuisine",
    "Activités manuelles",
    "Jeux de société",
    "Activités sportives",
    "Sorties et découvertes",
    "Gestion d'équipe",
    "Développement professionnel",
    "Outils de planification",
  ];

  // Générer les suggestions en fonction de la recherche
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: SearchSuggestion[] = [];
    const lowerQuery = query.toLowerCase();

    // Ajouter la recherche par mot-clé
    newSuggestions.push({
      type: "keyword",
      value: query,
      label: `Rechercher "${query}"`,
    });

    // Suggestions de tags
    if (tags) {
      tags
        .filter((tag) => tag.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach((tag) => {
          newSuggestions.push({
            type: "tag",
            value: tag.slug,
            label: tag.name,
          });
        });
    }

    // Suggestions de thématiques
    if (themes) {
      themes
        .filter((theme) => theme.name.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach((theme) => {
          newSuggestions.push({
            type: "theme",
            value: theme.slug,
            label: theme.name,
          });
        });
    }

    // Suggestions de catégories
    categories
      .filter((cat) => cat.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach((cat) => {
        newSuggestions.push({
          type: "category",
          value: cat,
          label: cat,
        });
      });

    setSuggestions(newSuggestions);
  }, [query, tags, themes]);

  // Fermer les suggestions quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    // Éviter les doublons
    if (!selectedFilters.some((f) => f.value === suggestion.value && f.type === suggestion.type)) {
      setSelectedFilters([...selectedFilters, suggestion]);
    }
    setQuery("");
    setIsOpen(false);
  };

  const handleRemoveFilter = (filter: SearchSuggestion) => {
    setSelectedFilters(selectedFilters.filter((f) => f !== filter));
  };

  const handleSearch = () => {
    if (selectedFilters.length === 0 && query.length === 0) return;

    // Construire l'URL de recherche avec les paramètres
    const params = new URLSearchParams();

    selectedFilters.forEach((filter) => {
      if (filter.type === "keyword") {
        params.append("q", filter.value);
      } else if (filter.type === "tag") {
        params.append("tag", filter.value);
      } else if (filter.type === "theme") {
        params.append("theme", filter.value);
      } else if (filter.type === "category") {
        params.append("category", filter.value);
      }
    });

    // Ajouter la recherche en cours si elle n'est pas vide
    if (query.length > 0) {
      params.append("q", query);
    }

    setLocation(`/resources?${params.toString()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (suggestions.length > 0 && isOpen) {
        handleSelectSuggestion(suggestions[0]);
      } else {
        handleSearch();
      }
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "tag":
        return <Tag className="h-3 w-3" />;
      case "theme":
        return <BookOpen className="h-3 w-3" />;
      case "category":
        return <Layers className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "tag":
        return "secondary";
      case "theme":
        return "outline";
      case "category":
        return "default";
      default:
        return "secondary";
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Filtres sélectionnés */}
      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedFilters.map((filter, index) => (
            <Badge
              key={`${filter.type}-${filter.value}-${index}`}
              variant={getBadgeVariant(filter.type)}
              className="flex items-center gap-1 pl-2 pr-1"
            >
              {getIcon(filter.type)}
              <span className="text-xs">{filter.label}</span>
              <button
                onClick={() => handleRemoveFilter(filter)}
                className="ml-1 hover:bg-background/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par mots-clés, tags, thématiques..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />

          {/* Suggestions */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 border-b last:border-b-0"
                >
                  {getIcon(suggestion.type)}
                  <span className="flex-1">{suggestion.label}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type === "keyword" && "Mot-clé"}
                    {suggestion.type === "tag" && "Tag"}
                    {suggestion.type === "theme" && "Thématique"}
                    {suggestion.type === "category" && "Catégorie"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </div>

        <Button onClick={handleSearch} className="shrink-0">
          <Search className="h-4 w-4 mr-2" />
          Rechercher
        </Button>
      </div>
    </div>
  );
}
