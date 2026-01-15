import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Heart, MessageCircle, Trash2, Flag, Loader, Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface ResourceCommentsProps {
  resourceId: number;
}

export function ResourceComments({ resourceId }: ResourceCommentsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(5);
  const [hasTested, setHasTested] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: comments = [], isLoading } = trpc.comments.listByResource.useQuery({ resourceId });
  const createCommentMutation = trpc.comments.create.useMutation();
  const deleteCommentMutation = trpc.comments.delete.useMutation();
  const utils = trpc.useUtils();

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await createCommentMutation.mutateAsync({
        resourceId,
        content: newComment,
        rating,
        hasTested,
      });

      setNewComment("");
      setRating(5);
      setHasTested(false);
      utils.comments.listByResource.invalidate({ resourceId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      try {
        await deleteCommentMutation.mutateAsync({ id: commentId });
        utils.comments.listByResource.invalidate({ resourceId });
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const averageRating = comments.length > 0
    ? (comments.reduce((sum: number, c: any) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
    : 0;

  const testedCount = comments.filter((c: any) => c.hasTested === "true").length;

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{averageRating}</div>
              <div className="flex justify-center gap-1 mt-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(Number(averageRating))
                        ? "fill-yellow-500 text-yellow-500"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Note moyenne</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{comments.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Avis</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{testedCount}</div>
              <p className="text-xs text-muted-foreground mt-2">Ont testé</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">
                {comments.length > 0 ? ((testedCount / comments.length) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-2">Taux de test</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Formulaire de commentaire */}
      {user ? (
        <Card className="bg-accent/50">
          <CardHeader>
            <CardTitle className="text-lg">Partager votre avis</CardTitle>
            <CardDescription>Aidez la communauté en partageant votre expérience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Notation */}
            <div>
              <label className="block text-sm font-medium mb-2">Votre note</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-yellow-500 text-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium mb-2">Votre commentaire</label>
              <Textarea
                placeholder="Partagez votre expérience avec cette ressource..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={4}
              />
            </div>

            {/* Badge "J'ai testé" */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="tested"
                checked={hasTested}
                onChange={(e) => setHasTested(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="tested" className="text-sm font-medium cursor-pointer">
                ✓ J'ai testé cette activité
              </label>
            </div>

            {/* Boutons */}
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setNewComment("");
                  setRating(5);
                  setHasTested(false);
                }}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Publier l'avis"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-blue-900">
              Connectez-vous pour partager votre avis et aider la communauté.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Liste des commentaires */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Avis des utilisateurs ({comments.length})</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">Aucun avis pour le moment. Soyez le premier à partager !</p>
            </CardContent>
          </Card>
        ) : (
          comments.map((comment: any) => (
            <Card key={comment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* En-tête du commentaire */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{comment.userName || "Utilisateur"}</p>
                        {comment.hasTested === "true" && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ✓ A testé
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    {user?.id === comment.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  {/* Notation */}
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < (comment.rating || 0)
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>

                  {/* Contenu du commentaire */}
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
