import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Check } from "lucide-react";

interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  authentication: string;
  parameters?: Array<{ name: string; type: string; required: boolean; description: string }>;
  example?: string;
}

const apiEndpoints: APIEndpoint[] = [
  {
    method: "GET",
    path: "/api/resources",
    description: "Récupère la liste de toutes les ressources",
    authentication: "Bearer Token",
    parameters: [
      { name: "page", type: "number", required: false, description: "Numéro de page (défaut: 1)" },
      { name: "limit", type: "number", required: false, description: "Nombre de résultats par page (défaut: 20)" },
      { name: "search", type: "string", required: false, description: "Recherche par mots-clés" },
      { name: "tags", type: "string", required: false, description: "Filtrer par tags (séparés par des virgules)" },
    ],
    example: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://api.ressourcerie-ifac.fr/api/resources?page=1&limit=20"`,
  },
  {
    method: "GET",
    path: "/api/resources/:id",
    description: "Récupère les détails d'une ressource spécifique",
    authentication: "Bearer Token",
    example: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://api.ressourcerie-ifac.fr/api/resources/123"`,
  },
  {
    method: "POST",
    path: "/api/resources",
    description: "Crée une nouvelle ressource",
    authentication: "Bearer Token (Contributeur)",
    parameters: [
      { name: "title", type: "string", required: true, description: "Titre de la ressource" },
      { name: "description", type: "string", required: true, description: "Description" },
      { name: "content", type: "string", required: true, description: "Contenu" },
      { name: "tags", type: "array", required: false, description: "Tags" },
    ],
    example: `curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Ma ressource",
    "description": "Description",
    "content": "Contenu",
    "tags": ["animation", "enfants"]
  }' \\
  "https://api.ressourcerie-ifac.fr/api/resources"`,
  },
  {
    method: "GET",
    path: "/api/collections",
    description: "Récupère les collections de l'utilisateur",
    authentication: "Bearer Token",
    example: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://api.ressourcerie-ifac.fr/api/collections"`,
  },
  {
    method: "GET",
    path: "/api/comments/:resourceId",
    description: "Récupère les commentaires d'une ressource",
    authentication: "Bearer Token",
    example: `curl -H "Authorization: Bearer YOUR_TOKEN" \\
  "https://api.ressourcerie-ifac.fr/api/comments/123"`,
  },
  {
    method: "POST",
    path: "/api/comments/:resourceId",
    description: "Ajoute un commentaire à une ressource",
    authentication: "Bearer Token",
    parameters: [
      { name: "content", type: "string", required: true, description: "Contenu du commentaire" },
      { name: "rating", type: "number", required: false, description: "Note de 1 à 5" },
    ],
    example: `curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Excellente ressource!",
    "rating": 5
  }' \\
  "https://api.ressourcerie-ifac.fr/api/comments/123"`,
  },
];

export default function APIDocumentation() {
  const [copiedExample, setCopiedExample] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedExample(text);
    setTimeout(() => setCopiedExample(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-blue-100 text-blue-800";
      case "POST":
        return "bg-green-100 text-green-800";
      case "PUT":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-muted/50">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">API Publique</h1>
          <p className="text-muted-foreground mt-2">Documentation de l'API REST de la Ressourcerie IFAC</p>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Authentication */}
        <Card>
          <CardHeader>
            <CardTitle>Authentification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Toutes les requêtes API doivent inclure un token d'authentification Bearer dans l'en-tête Authorization.
            </p>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono mb-2">Authorization: Bearer YOUR_API_TOKEN</p>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Votre clé API :</label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="Entrez votre clé API"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey)}
                  disabled={!apiKey}
                  className="gap-2"
                >
                  {copiedExample === apiKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copier
                </Button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <p className="font-semibold mb-1">💡 Conseil</p>
              <p>Vous pouvez générer une clé API dans vos paramètres de compte.</p>
            </div>
          </CardContent>
        </Card>

        {/* Base URL */}
        <Card>
          <CardHeader>
            <CardTitle>URL de base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm font-mono">https://api.ressourcerie-ifac.fr</p>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Points de terminaison</h2>
          <div className="space-y-4">
            {apiEndpoints.map((endpoint, idx) => (
              <Card key={idx}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getMethodColor(endpoint.method)}>{endpoint.method}</Badge>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{endpoint.path}</code>
                      </div>
                      <CardDescription>{endpoint.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold mb-1">Authentification</p>
                    <p className="text-sm text-muted-foreground">{endpoint.authentication}</p>
                  </div>

                  {endpoint.parameters && endpoint.parameters.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Paramètres</p>
                      <div className="space-y-2">
                        {endpoint.parameters.map((param, pidx) => (
                          <div key={pidx} className="text-sm bg-muted p-2 rounded">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="font-mono">{param.name}</code>
                              <Badge variant="outline" className="text-xs">
                                {param.type}
                              </Badge>
                              {param.required && <Badge className="text-xs">Requis</Badge>}
                            </div>
                            <p className="text-muted-foreground">{param.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {endpoint.example && (
                    <div>
                      <p className="text-sm font-semibold mb-2">Exemple</p>
                      <div className="bg-muted p-4 rounded-lg relative">
                        <pre className="text-xs overflow-x-auto">{endpoint.example}</pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(endpoint.example!)}
                          className="absolute top-2 right-2 gap-2"
                        >
                          {copiedExample === endpoint.example ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Rate Limiting */}
        <Card>
          <CardHeader>
            <CardTitle>Limitation de débit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>Les requêtes API sont limitées à :</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>100 requêtes par minute pour les utilisateurs authentifiés</li>
              <li>10 requêtes par minute pour les requêtes non authentifiées</li>
              <li>Les en-têtes de réponse incluent les informations de limitation</li>
            </ul>
          </CardContent>
        </Card>

        {/* Error Handling */}
        <Card>
          <CardHeader>
            <CardTitle>Gestion des erreurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">Les erreurs sont retournées avec les codes HTTP appropriés :</p>
            <div className="space-y-2">
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">200 OK</p>
                <p className="text-muted-foreground">La requête a réussi</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">400 Bad Request</p>
                <p className="text-muted-foreground">Les paramètres de la requête sont invalides</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">401 Unauthorized</p>
                <p className="text-muted-foreground">L'authentification est manquante ou invalide</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">403 Forbidden</p>
                <p className="text-muted-foreground">Vous n'avez pas les permissions nécessaires</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">404 Not Found</p>
                <p className="text-muted-foreground">La ressource demandée n'existe pas</p>
              </div>
              <div className="bg-muted p-3 rounded">
                <p className="font-semibold">500 Internal Server Error</p>
                <p className="text-muted-foreground">Une erreur serveur s'est produite</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>Support</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Vous avez besoin d'aide ? Consultez notre documentation complète ou contactez notre équipe de support.
            </p>
            <div className="flex gap-2">
              <Button variant="outline">Documentation</Button>
              <Button variant="outline">Nous contacter</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
