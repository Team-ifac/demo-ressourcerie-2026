import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, TrendingUp, Users, DollarSign, CheckCircle2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminSubscriptions() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month');

  // Données mockées pour les statistiques
  const stats = {
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    conversionRate: 0,
    retentionRate: 85,
    activeSubscriptionsChange: 0,
    monthlyRevenueChange: 0,
    chartData: [{ date: '01 Jan', subscriptions: 0, revenue: 0 }],
  };
  const isLoadingStats = false;

  // Données mockées pour les adhésions
  const subscriptions: any[] = [];
  const isLoadingSubscriptions = false;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  const formatDate = (date: string | number) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestion des adhésions</h1>
        <p className="text-muted-foreground">Suivi des adhésions et des revenus</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Adhésions actives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeSubscriptions || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.activeSubscriptionsChange || 0}% vs période précédente
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Revenu mensuel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{formatCurrency(stats?.monthlyRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.monthlyRevenueChange || 0}% vs mois précédent
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de conversion
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.conversionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisateurs → Adhésions
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taux de rétention
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.retentionRate || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Renouvellement automatique
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Aperçu</TabsTrigger>
          <TabsTrigger value="subscriptions">Adhésions</TabsTrigger>
        </TabsList>

        {/* Onglet Aperçu */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendance des adhésions</CardTitle>
              <CardDescription>
                Évolution du nombre d'adhésions actives sur la période sélectionnée
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-96 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              ) : stats?.chartData ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="subscriptions"
                      stroke="#3b82f6"
                      name="Adhésions actives"
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#10b981"
                      name="Revenu (€)"
                      yAxisId="right"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Sélecteur de période */}
          <div className="flex gap-2">
            {(['week', 'month', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {range === 'week' ? 'Semaine' : range === 'month' ? 'Mois' : 'Année'}
              </button>
            ))}
          </div>
        </TabsContent>

        {/* Onglet Adhésions */}
        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Liste des adhésions</CardTitle>
              <CardDescription>Adhésions actives et récentes</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSubscriptions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : subscriptions && subscriptions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold">Utilisateur</th>
                        <th className="text-left py-3 px-4 font-semibold">Email</th>
                        <th className="text-left py-3 px-4 font-semibold">Statut</th>
                        <th className="text-left py-3 px-4 font-semibold">Valide jusqu'au</th>
                        <th className="text-left py-3 px-4 font-semibold">Date création</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptions.map((sub: any) => (
                        <tr key={sub.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{sub.userName || 'N/A'}</td>
                          <td className="py-3 px-4">{sub.userEmail || 'N/A'}</td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className={
                                sub.status === 'active'
                                  ? 'bg-green-50 text-green-700 border-green-200'
                                  : 'bg-red-50 text-red-700 border-red-200'
                              }
                            >
                              {sub.status === 'active' ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{formatDate(sub.currentPeriodEnd)}</td>
                          <td className="py-3 px-4">{formatDate(sub.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aucune adhésion trouvée</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
