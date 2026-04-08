import { useState, useEffect, useRef, useMemo } from "react";
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

interface AdvancedSearchProps {
  compact?: boolean;
  placeholder?: string;
}

export function AdvancedSearch({
  compact = false,
  placeholder,
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<SearchSuggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  const { data: tags } = trpc.tags.list.useQuery();
  const { data: themes } = trpc.themes.list.useQuery();
  const { data: categoryCounts = [] } =
    trpc.resources.listCategoriesWithCounts.useQuery();

  const categories = useMemo(
    () => categoryCounts.map((item) => item.key),
    [categoryCounts]
  );

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const newSuggestions: SearchSuggestion[] = [];
    const lowerQuery = trimmedQuery.toLowerCase();

    newSuggestions.push({
      type: "keyword",
      value: trimmedQuery,
      label: `Rechercher "${trimmedQuery}"`,
    });

    // IMPORTANT :
    // Les suggestions "métier" (tag, thème, catégorie) ne doivent pas
    // apparaître trop tôt, sinon une simple saisie partielle comme "ac"
    // envoie vers un filtre peu compréhensible.
    if (trimmedQuery.length >= 3) {
      if (tags) {
        tags
          .filter((tag) => tag.name.toLowerCase().includes(lowerQuery))
          .slice(0, 3)
          .forEach((tag) => {
            newSuggestions.push({
              type: "tag",
              value: tag.slug,
              label: `Tag : ${tag.name}`,
            });
          });
      }

      if (themes) {
        themes
          .filter((theme) => theme.name.toLowerCase().includes(lowerQuery))
          .slice(0, 3)
          .forEach((theme) => {
            newSuggestions.push({
              type: "theme",
              value: theme.slug,
              label: `Thématique : ${theme.name}`,
            });
          });
      }

      categories
        .filter((cat) => cat.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .forEach((cat) => {
          newSuggestions.push({
            type: "category",
            value: cat,
            label: `Catégorie : ${cat
              .split("/")
              .map((part) =>
                part.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
              )
              .join(" / ")}`,
          });
        });
    }

    setSuggestions(newSuggestions);
  }, [query, tags, themes, categories]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildSearchUrl = (suggestion?: SearchSuggestion) => {
    const params = new URLSearchParams();

    if (suggestion) {
      if (suggestion.type === "keyword") {
        params.append("q", suggestion.value);
      } else if (suggestion.type === "tag") {
        params.append("tag", suggestion.value);
      } else if (suggestion.type === "theme") {
        params.append("theme", suggestion.value);
      } else if (suggestion.type === "category") {
        params.append("categorie", suggestion.value);
      }

      return `/resources?${params.toString()}`;
    }

    selectedFilters.forEach((filter) => {
      if (filter.type === "keyword") {
        params.append("q", filter.value);
      } else if (filter.type === "tag") {
        params.append("tag", filter.value);
      } else if (filter.type === "theme") {
        params.append("theme", filter.value);
      } else if (filter.type === "category") {
        params.append("categorie", filter.value);
      }
    });

    if (query.length > 0) {
      params.append("q", query);
    }

    return `/resources?${params.toString()}`;
  };

  const navigateToSearch = (suggestion?: SearchSuggestion) => {
    setIsOpen(false);
    setLocation(buildSearchUrl(suggestion));
  };

  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    if (compact) {
      navigateToSearch(suggestion);
      return;
    }

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
    navigateToSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();

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

  const effectivePlaceholder = placeholder
    ? placeholder
    : compact
    ? "Rechercher..."
    : "Rechercher par mots-clés, tags, thématiques...";

  return (
    <div
      ref={searchRef}
      className={compact ? "relative w-full max-w-sm" : "relative w-full max-w-2xl"}
    >
      {!compact && selectedFilters.length > 0 && (
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
                type="button"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className={compact ? "relative" : "flex gap-2"}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={effectivePlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            className="pl-10"
          />

          {isOpen && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}-${index}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-2 border-b last:border-b-0"
                  type="button"
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

        {!compact && (
          <Button onClick={handleSearch} className="shrink-0" type="button">
            <Search className="h-4 w-4 mr-2" />
            Rechercher
          </Button>
        )}
      </div>
    </div>
  );
}