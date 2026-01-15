import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface Trend {
  name: string;
  change: number;
  period: string;
  status: "up" | "down" | "stable";
  insight: string;
}

interface TrendAnalysisProps {
  title?: string;
  description?: string;
}

export function TrendAnalysis({
  title = "Analyse des tendances",
  description = "Identifiez les patterns d'utilisation et les ressources en hausse",
}: TrendAnalysisProps) {
  const trends: Trend[] = [
    {
      name: "Activités ludiques",
      change: 23,
      period: "ce mois",
      status: "up",
      insight: "Forte demande pour les activités interactives",
    },
    {
      name: "Formation BAFA",
      change: 15,
      period: "ce mois",
      status: "up",
      insight: "Intérêt croissant pour la formation continue",
    },
    {
      name: "Gestion de groupe",
      change: 8,
      period: "ce mois",
      status: "up",
      insight: "Tendance stable avec légère croissance",
    },
    {
      name: "Ressources pédagogiques",
      change: -5,
      period: "ce mois",
      status: "down",
      insight: "Baisse d'intérêt - à investiguer",
    },
    {
      name: "Jeux de société",
      change: 12,
      period: "ce mois",
      status: "up",
      insight: "Ressources populaires en hausse",
    },
    {
      name: "Développement personnel",
      change: -3,
      period: "ce mois",
      status: "down",
      insight: "Légère baisse - considérer une mise à jour",
    },
  ];

  const seasonalPatterns = [
    {
      season: "Été",
      pattern: "Forte demande pour les activités outdoor",
      impact: "↑ 35%",
    },
    {
      season: "Rentrée scolaire",
      pattern: "Pics de téléchargements de ressources pédagogiques",
      impact: "↑ 48%",
    },
    {
      season: "Vacances scolaires",
      pattern: "Recherche d'activités de loisir augmente",
      impact: "↑ 42%",
    },
    {
      season: "Hiver",
      pattern: "Intérêt pour les activités d'intérieur",
      impact: "↑ 28%",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Tendances par catégorie */}
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trends.map((trend) => (
              <div
                key={trend.name}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-medium">{trend.name}</p>
                    {trend.status === "up" && (
                      <Badge className="bg-green-100 text-green-700 gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +{trend.change}%
                      </Badge>
                    )}
                    {trend.status === "down" && (
                      <Badge className="bg-red-100 text-red-700 gap-1">
                        <TrendingDown className="h-3 w-3" />
                        {trend.change}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{trend.insight}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{trend.period}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patterns saisonniers */}
      <Card>
        <CardHeader>
          <CardTitle>Patterns saisonniers</CardTitle>
          <CardDescription>
            Tendances d'utilisation selon les saisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {seasonalPatterns.map((item) => (
              <div
                key={item.season}
                className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-purple-50"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-lg">{item.season}</p>
                  <Badge className="bg-blue-100 text-blue-700">{item.impact}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.pattern}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alertes et recommandations */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <CardTitle className="text-yellow-900">Alertes et recommandations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex gap-3">
              <span className="text-yellow-600 font-bold">⚠️</span>
              <span className="text-sm">
                <strong>Ressources pédagogiques en baisse :</strong> Envisager une mise à jour du contenu ou une meilleure promotion
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-600 font-bold">⚠️</span>
              <span className="text-sm">
                <strong>Pic saisonnier à venir :</strong> Préparez plus de contenu pour la rentrée scolaire (hausse de 48%)
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-600 font-bold">✓</span>
              <span className="text-sm">
                <strong>Activités ludiques en hausse :</strong> Continuer à développer ce segment populaire
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-yellow-600 font-bold">✓</span>
              <span className="text-sm">
                <strong>Engagement utilisateur stable :</strong> Maintenir la qualité actuelle du contenu
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
