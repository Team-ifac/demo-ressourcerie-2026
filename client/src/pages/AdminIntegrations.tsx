import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, Slack, MessageSquare, BarChart3, CreditCard } from "lucide-react";

export default function AdminIntegrations() {
  const [slackWebhook, setSlackWebhook] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [gaId, setGaId] = useState("");
  const [stripeKey, setStripeKey] = useState("");
  const [activeTab, setActiveTab] = useState("slack");

  const handleSaveSlack = () => {
    console.log("Slack webhook sauvegardé:", slackWebhook);
    // Appel API pour sauvegarder
  };

  const handleSaveDiscord = () => {
    console.log("Discord webhook sauvegardé:", discordWebhook);
    // Appel API pour sauvegarder
  };

  const handleSaveGA = () => {
    console.log("Google Analytics ID sauvegardé:", gaId);
    // Appel API pour sauvegarder
  };

  const handleSaveStripe = () => {
    console.log("Stripe key sauvegardée:", stripeKey);
    // Appel API pour sauvegarder
  };

  const handleTestSlack = () => {
    console.log("Test de connexion Slack...");
    // Appel API pour tester
  };

  const handleTestDiscord = () => {
    console.log("Test de connexion Discord...");
    // Appel API pour tester
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Intégrations</h1>
        <p className="text-gray-600 mt-2">
          Configurez les services externes pour améliorer votre plateforme
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="slack" className="gap-2">
            <Slack className="h-4 w-4" />
            Slack
          </TabsTrigger>
          <TabsTrigger value="discord" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Discord
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="stripe" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Stripe
          </TabsTrigger>
        </TabsList>

        {/* Slack Tab */}
        <TabsContent value="slack" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Slack className="h-5 w-5" />
                Intégration Slack
              </CardTitle>
              <CardDescription>
                Recevez les notifications importantes directement dans Slack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  type="password"
                />
                <p className="text-xs text-gray-500">
                  Trouvez votre webhook URL dans les paramètres Slack
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notifications</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Nouvelles ressources soumises</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Nouveaux commentaires</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Sujets au forum</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Erreurs critiques</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTestSlack} variant="outline">
                  Tester la connexion
                </Button>
                <Button onClick={handleSaveSlack}>Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Discord Tab */}
        <TabsContent value="discord" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Intégration Discord
              </CardTitle>
              <CardDescription>
                Recevez les notifications importantes directement dans Discord
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Webhook URL</label>
                <Input
                  placeholder="https://discord.com/api/webhooks/..."
                  value={discordWebhook}
                  onChange={(e) => setDiscordWebhook(e.target.value)}
                  type="password"
                />
                <p className="text-xs text-gray-500">
                  Créez un webhook dans les paramètres de votre serveur Discord
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Notifications</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Nouvelles ressources soumises</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Nouveaux commentaires</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Sujets au forum</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked />
                    <span className="text-sm">Erreurs critiques</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleTestDiscord} variant="outline">
                  Tester la connexion
                </Button>
                <Button onClick={handleSaveDiscord}>Sauvegarder</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Google Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Suivez les statistiques détaillées de votre plateforme
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Measurement ID</label>
                <Input
                  placeholder="G-XXXXXXXXXX"
                  value={gaId}
                  onChange={(e) => setGaId(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Trouvez votre ID de mesure dans Google Analytics
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Événements suivis</label>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Vues de ressources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Téléchargements</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Partages sociaux</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Commentaires</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span>Participation au forum</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveGA}>Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Stripe
              </CardTitle>
              <CardDescription>
                Gérez les paiements et les abonnements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Secret Key</label>
                <Input
                  placeholder="sk_live_..."
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  type="password"
                />
                <p className="text-xs text-gray-500">
                  Trouvez votre clé secrète dans les paramètres Stripe
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plans disponibles</label>
                <div className="space-y-2 text-sm">
                  <div className="p-2 border rounded">
                    <div className="font-medium">Gratuit</div>
                    <div className="text-gray-600">Accès aux ressources</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">Supporter - 4,99€/mois</div>
                    <div className="text-gray-600">Accès illimité + ressources premium</div>
                  </div>
                  <div className="p-2 border rounded">
                    <div className="font-medium">Professionnel - 9,99€/mois</div>
                    <div className="text-gray-600">Tout + API access + Analytics avancées</div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveStripe}>Sauvegarder</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>État des intégrations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Slack className="h-4 w-4" />
              Slack
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Non configuré
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Discord
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Non configuré
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Google Analytics
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Non configuré
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Stripe
            </span>
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              Non configuré
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
