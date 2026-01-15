import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Heart, MessageCircle, Share2, Zap } from "lucide-react";

interface UserBadgesProps {
  userId: number;
  stats?: {
    resourcesContributed?: number;
    commentsPosted?: number;
    resourcesTested?: number;
    collectionsCreated?: number;
    forumPostsCreated?: number;
  };
}

export function UserBadges({ userId, stats = {} }: UserBadgesProps) {
  // Définir les badges disponibles
  const badges = [
    {
      id: "contributor",
      name: "Contributeur",
      description: "Avoir soumis au moins 1 ressource",
      icon: "📤",
      color: "bg-blue-100 text-blue-700",
      unlocked: (stats.resourcesContributed || 0) >= 1,
      requirement: stats.resourcesContributed || 0,
      total: 1,
    },
    {
      id: "prolific-contributor",
      name: "Contributeur prolifique",
      description: "Avoir soumis au moins 5 ressources",
      icon: "🚀",
      color: "bg-purple-100 text-purple-700",
      unlocked: (stats.resourcesContributed || 0) >= 5,
      requirement: stats.resourcesContributed || 0,
      total: 5,
    },
    {
      id: "tester",
      name: "Testeur actif",
      description: "Avoir testé au moins 10 ressources",
      icon: "✓",
      color: "bg-green-100 text-green-700",
      unlocked: (stats.resourcesTested || 0) >= 10,
      requirement: stats.resourcesTested || 0,
      total: 10,
    },
    {
      id: "expert-tester",
      name: "Expert testeur",
      description: "Avoir testé au least 50 ressources",
      icon: "⭐",
      color: "bg-yellow-100 text-yellow-700",
      unlocked: (stats.resourcesTested || 0) >= 50,
      requirement: stats.resourcesTested || 0,
      total: 50,
    },
    {
      id: "commentator",
      name: "Commentateur",
      description: "Avoir posté au moins 5 commentaires",
      icon: "💬",
      color: "bg-cyan-100 text-cyan-700",
      unlocked: (stats.commentsPosted || 0) >= 5,
      requirement: stats.commentsPosted || 0,
      total: 5,
    },
    {
      id: "community-helper",
      name: "Aide communautaire",
      description: "Avoir créé au moins 3 sujets au forum",
      icon: "🤝",
      color: "bg-pink-100 text-pink-700",
      unlocked: (stats.forumPostsCreated || 0) >= 3,
      requirement: stats.forumPostsCreated || 0,
      total: 3,
    },
    {
      id: "curator",
      name: "Curateur",
      description: "Avoir créé au least 3 collections",
      icon: "📚",
      color: "bg-orange-100 text-orange-700",
      unlocked: (stats.collectionsCreated || 0) >= 3,
      requirement: stats.collectionsCreated || 0,
      total: 3,
    },
    {
      id: "super-contributor",
      name: "Super contributeur",
      description: "Avoir soumis 10 ressources ET testé 50 ressources",
      icon: "👑",
      color: "bg-red-100 text-red-700",
      unlocked:
        (stats.resourcesContributed || 0) >= 10 &&
        (stats.resourcesTested || 0) >= 50,
      requirement: Math.min(
        stats.resourcesContributed || 0,
        stats.resourcesTested || 0
      ),
      total: 10,
    },
  ];

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);

  return (
    <div className="space-y-6">
      {/* Résumé des badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Vos réalisations
          </CardTitle>
          <CardDescription>
            Débloquez des badges en contribuant à la communauté
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500">{unlockedBadges.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Badges débloqués</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">{stats.resourcesContributed || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Ressources soumises</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">{stats.resourcesTested || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Ressources testées</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">{stats.commentsPosted || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Commentaires postés</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges débloqués */}
      {unlockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Badges débloqués ✨</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unlockedBadges.map((badge) => (
              <Card key={badge.id} className={`${badge.color} border-0`}>
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs opacity-75 mt-1">{badge.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Badges à débloquer */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Badges à débloquer 🎯</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {lockedBadges.map((badge) => (
              <Card key={badge.id} className="opacity-50 hover:opacity-75 transition-opacity">
                <CardContent className="pt-6 text-center">
                  <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <div className="mt-3 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-full transition-all"
                      style={{
                        width: `${Math.min(
                          (badge.requirement / badge.total) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {badge.requirement} / {badge.total}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Conseils pour débloquer plus de badges */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base">💡 Conseils pour débloquer des badges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-blue-900">
          <p>✓ Contribuez en soumettant des ressources pédagogiques</p>
          <p>✓ Testez les ressources et laissez des commentaires constructifs</p>
          <p>✓ Participez au forum d'entraide et aidez les autres</p>
          <p>✓ Créez des collections pour organiser vos ressources favorites</p>
          <p>✓ Soyez actif et engagé dans la communauté !</p>
        </CardContent>
      </Card>
    </div>
  );
}
