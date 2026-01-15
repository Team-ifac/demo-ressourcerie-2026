import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Eye, Download, Heart, MessageSquare, TrendingUp } from "lucide-react";

interface ResourceStatsProps {
  resourceId: number;
  resourceTitle: string;
}

export function ResourceStats({
  resourceId,
  resourceTitle,
}: ResourceStatsProps) {
  // Mock data - en production, cela viendrait du backend
  const dailyStats = [
    { date: "Lun", views: 45, downloads: 8, likes: 3 },
    { date: "Mar", views: 52, downloads: 10, likes: 5 },
    { date: "Mer", views: 48, downloads: 9, likes: 4 },
    { date: "Jeu", views: 61, downloads: 12, likes: 7 },
    { date: "Ven", views: 55, downloads: 11, likes: 6 },
    { date: "Sam", views: 42, downloads: 7, likes: 2 },
    { date: "Dim", views: 38, downloads: 6, likes: 1 },
  ];

  const weeklyStats = [
    { week: "Sem 1", views: 320, downloads: 58 },
    { week: "Sem 2", views: 385, downloads: 72 },
    { week: "Sem 3", views: 412, downloads: 85 },
    { week: "Sem 4", views: 398, downloads: 78 },
  ];

  const stats = {
    totalViews: 1515,
    totalDownloads: 293,
    totalLikes: 25,
    totalComments: 12,
    avgTimeOnPage: "2m 34s",
    bounceRate: 32,
    conversionRate: 19.3,
  };

  return (
    <div className="space-y-6">
      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Vues</p>
                <Eye className="h-4 w-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
              <p className="text-xs text-green-600">+12% cette semaine</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Téléchargements</p>
                <Download className="h-4 w-4 text-green-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              <p className="text-xs text-green-600">+8% cette semaine</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Favoris</p>
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalLikes}</p>
              <p className="text-xs text-green-600">+3 cette semaine</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Commentaires</p>
                <MessageSquare className="h-4 w-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold">{stats.totalComments}</p>
              <p className="text-xs text-green-600">+2 cette semaine</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique des vues quotidiennes */}
      <Card>
        <CardHeader>
          <CardTitle>Activité quotidienne</CardTitle>
          <CardDescription>Vues, téléchargements et favoris par jour</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#3b82f6"
                name="Vues"
              />
              <Line
                type="monotone"
                dataKey="downloads"
                stroke="#10b981"
                name="Téléchargements"
              />
              <Line
                type="monotone"
                dataKey="likes"
                stroke="#ef4444"
                name="Favoris"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique des vues hebdomadaires */}
      <Card>
        <CardHeader>
          <CardTitle>Tendance hebdomadaire</CardTitle>
          <CardDescription>Comparaison des 4 dernières semaines</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="views" fill="#3b82f6" name="Vues" />
              <Bar dataKey="downloads" fill="#10b981" name="Téléchargements" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métriques d'engagement */}
      <Card>
        <CardHeader>
          <CardTitle>Métriques d'engagement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Temps moyen sur la page</p>
              <p className="text-3xl font-bold">{stats.avgTimeOnPage}</p>
              <p className="text-xs text-muted-foreground">+15s cette semaine</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Taux de rebond</p>
              <p className="text-3xl font-bold">{stats.bounceRate}%</p>
              <p className="text-xs text-green-600">-5% cette semaine</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Taux de conversion</p>
              <p className="text-3xl font-bold">{stats.conversionRate}%</p>
              <p className="text-xs text-green-600">+2% cette semaine</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
