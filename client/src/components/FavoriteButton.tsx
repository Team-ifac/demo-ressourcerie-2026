import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

interface FavoriteButtonProps {
  resourceId: number;
  size?: "sm" | "lg" | "icon" | "icon-sm" | "icon-lg";
  variant?: "default" | "ghost" | "outline";
  showLabel?: boolean;
}

export function FavoriteButton({ 
  resourceId, 
  size = "sm", 
  variant = "ghost",
  showLabel = false 
}: FavoriteButtonProps) {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: favoriteData, isLoading: isCheckingFavorite } = 
    trpc.favorites.check.useQuery(
      { resourceId },
      { enabled: !!user }
    );
  
  const isFavorite = favoriteData?.isFavorite ?? false;

  const addFavoriteMutation = trpc.favorites.add.useMutation({
    onSuccess: () => {
      utils.favorites.check.invalidate({ resourceId });
      utils.favorites.list.invalidate();
      toast.success("Ressource ajoutée aux favoris");
    },
    onError: () => {
      toast.error("Erreur lors de l'ajout aux favoris");
    },
  });

  const removeFavoriteMutation = trpc.favorites.remove.useMutation({
    onSuccess: () => {
      utils.favorites.check.invalidate({ resourceId });
      utils.favorites.list.invalidate();
      toast.success("Ressource retirée des favoris");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression des favoris");
    },
  });

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Connectez-vous pour ajouter des favoris");
      return;
    }

    if (isFavorite) {
      removeFavoriteMutation.mutate({ resourceId });
    } else {
      addFavoriteMutation.mutate({ resourceId });
    }
  };

  const isLoading = isCheckingFavorite || addFavoriteMutation.isPending || removeFavoriteMutation.isPending;

  const sizeMap: Record<string, string> = {
    sm: "h-8 w-8 p-0",
    lg: "h-12 w-12 p-0",
    icon: "h-10 w-10 p-0",
    "icon-sm": "h-8 w-8 p-0",
    "icon-lg": "h-12 w-12 p-0",
  };

  return (
    <Button
      size={size as any}
      variant={variant}
      className={`${sizeMap[size]} ${isFavorite ? "text-red-500" : ""}`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
          {showLabel && (
            <span className="ml-2">
              {isFavorite ? "Favoris" : "Ajouter"}
            </span>
          )}
        </>
      )}
    </Button>
  );
}
