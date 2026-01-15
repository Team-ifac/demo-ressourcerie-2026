import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Download,
  Eye,
  Users,
  FileText,
  Calendar,
  Filter,
  MoreVertical,
} from "lucide-react";
import { MonthlyReport } from "@/components/MonthlyReport";
import { TrendAnalysis } from "@/components/TrendAnalysis";

export default function AdminAnalytics() {
  // Mock data pour les statistiques
  const overallStats = {
    totalViews: 15234,
    totalDownloads: 3421,
    totalUsers: 892,
    totalResources: 156,
    avgRating: 4.2,
    engagementRate: 68,
  };

  const viewsData = [
    { month: "Jan", views: 2400, downloads: 240 },
    { month: "Fév", views: 3210, downloads: 321 },
    { month: "Mar", views: 2290, downloads: 229 },
    { month: "Avr", views: 2000, downloads: 200 },
    { month: "Mai", views: 2181, downloads: 218 },
    { month: "Jun", views: 2500, downloads: 250 },
  ];

  const categoryData = [
    { name: "Activités ludiques", value: 2400, color: "#3b82f6" },
    { name: "Formation", value: 1398, color: "#8b5cf6" },
    { name: "Gestion de groupe", value: 9800, color: "#ec4899" },
    { name: "Ressources pédagogiques", value: 3908, color: "#f59e0b" },
    { name: "Autres", value: 4800, color: "#10b981" },
  ];

  const topResources = [
    {
      id: 1,
      title: "Jeu des 5 sens",
      views: 2341,
      downloads: 456,
      rating: 4.8,
      engagement: 92,
    },
    {
      id: 2,
      title: "Gestion des conflits",
      views: 1876,
      downloads: 234,
      rating: 4.5,
      engagement: 78,
    },
    {
      id: 3,
      title: "Activités en groupe",
      views: 1654,
      downloads: 198,
      rating: 4.3,
      engagement: 71,
    },
    {
      id: 4,
      title: "Formation BAFA",
      views: 1432,
      downloads: 167,
      rating: 4.6,
      engagement: 85,
    },
    {
      id: 5,
      title: "Jeux de société",
      views: 1289,
      downloads: 145,
      rating: 4.1,
      engagement: 65,
    },
  ];

  const engagementData = [
    { metric: "Commentaires", value: 234, trend: "+12%" },
    { metric: "Collections créées", value: 89, trend: "+8%" },
    { metric: "Ressources testées", value: 456, trend: "+23%" },
    { metric: "Sujets au forum", value: 67, trend: "+15%" },
  ];

  const userGrowth = [
    { week: "Sem 1", users: 120, active: 95 },
    { week: "Sem 2", users: 180, active: 145 },
    { week: "Sem 3", users: 250, active: 200 },
    { week: "Sem 4", users: 320, active: 265 },
    { week: "Sem 5", users: 420, active: 350 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">

      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Breadcrumb items={[{ label: "Admin" }, { label: "Analytics" }]} />
              <h1 className="text-4xl font-bold mt-4">Dashboard Analytics</h1>
              <p className="text-muted-foreground mt-2">
                Suivi des performances et engagement de la plateforme
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Calendar className="h-4 w-4" />
                Juin 2024
              </Button>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtres
              </Button>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Vues totales</p>
                    <Eye className="h-4 w-4 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">{overallStats.totalViews.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+12% ce mois</p>
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
                  <p className="text-3xl font-bold">{overallStats.totalDownloads.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+8% ce mois</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Utilisateurs</p>
                    <Users className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold">{overallStats.totalUsers.toLocaleString()}</p>
                  <p className="text-xs text-green-600">+15% ce mois</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Ressources</p>
                    <FileText className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold">{overallStats.totalResources}</p>
                  <p className="text-xs text-green-600">+5 ce mois</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Note moyenne</p>
                    <TrendingUp className="h-4 w-4 text-yellow-500" />
                  </div>
                  <p className="text-3xl font-bold">{overallStats.avgRating}</p>
                  <p className="text-xs text-muted-foreground">sur 5</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Engagement</p>
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-3xl font-bold">{overallStats.engagementRate}%</p>
                  <p className="text-xs text-green-600">+3% ce mois</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
              <TabsTrigger value="resources">Ressources</TabsTrigger>
              <TabsTrigger value="engagement">Engagement</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs</TabsTrigger>
            </TabsList>

            {/* Onglet Vue d'ensemble */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Vues et téléchargements</CardTitle>
                  <CardDescription>Tendance sur les 6 derniers mois</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
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
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution par catégorie</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) =>
                            `${name}: ${value}`
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engagement par métrique</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {engagementData.map((item) => (
                      <div
                        key={item.metric}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium">{item.metric}</p>
                          <p className="text-2xl font-bold">{item.value}</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          {item.trend}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Onglet Ressources */}
            <TabsContent value="resources" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Top 5 ressources</CardTitle>
                  <CardDescription>
                    Les ressources les plus consultées et téléchargées
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topResources.map((resource, index) => (
                      <div
                        key={resource.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="w-8 h-8 flex items-center justify-center rounded-full">
                              {index + 1}
                            </Badge>
                            <div>
                              <p className="font-medium">{resource.title}</p>
                              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" /> {resource.views} vues
                                </span>
                                <span className="flex items-center gap-1">
                                  <Download className="h-3 w-3" /> {resource.downloads} DL
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">⭐ {resource.rating}</p>
                          <p className="text-sm text-muted-foreground">
                            {resource.engagement}% engagement
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Engagement */}
            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques d'engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={engagementData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Utilisateurs */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Croissance des utilisateurs</CardTitle>
                  <CardDescription>
                    Nouveaux utilisateurs et utilisateurs actifs par semaine
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="users" fill="#3b82f6" name="Nouveaux" />
                      <Bar dataKey="active" fill="#10b981" name="Actifs" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Section Rapports et Tendances */}
          <div className="space-y-6">
            <MonthlyReport month="Juin" year={2024} />
            <TrendAnalysis />
          </div>
        </div>
      </main>
    </div>
  );
}

