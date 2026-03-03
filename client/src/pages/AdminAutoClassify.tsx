import { useState } from "react";
import { Zap, CheckCircle, AlertCircle } from "lucide-react";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";

import { trpc } from "../lib/trpc";

export default function AdminAutoClassify() {
  const [isClassifying, setIsClassifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{
    classified: number;
    skipped: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoAssociateMutation = trpc.collectionAssociation.autoAssociate.useMutation({
    onSuccess: (data) => {
      setResults({
        classified: data.associationsCreated,
        skipped: data.associationsSkipped,
        total: data.associationsCreated + data.associationsSkipped,
      });
      setIsClassifying(false);
      setProgress(100);
    },
    onError: (error) => {
      setError(error.message || "Une erreur s'est produite");
      setIsClassifying(false);
    },
  });

  const handleClassify = async () => {
    setIsClassifying(true);
    setProgress(0);
    setError(null);
    setResults(null);

    // Simuler la progression
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 30;
      });
    }, 500);

    try {
      await autoAssociateMutation.mutateAsync({
        minScore: 30,
        overwrite: false,
      });
    } finally {
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container space-y-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Classification Automatique</h1>
            <p className="text-lg text-muted-foreground">
              Classez automatiquement les ressources non associées dans les collections appropriées
            </p>
          </div>

          {/* Carte de classification */}
          <Card className="shadow-elegant">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <CardTitle>Classer les ressources</CardTitle>
              </div>
              <CardDescription>
                Cette action analysera chaque ressource non classée et la placera dans la collection la plus appropriée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Bouton de classification */}
              <Button
                onClick={handleClassify}
                disabled={isClassifying}
                size="lg"
                className="w-full"
              >
                {isClassifying ? "Classification en cours..." : "Lancer la classification"}
              </Button>

              {/* Barre de progression */}
              {isClassifying && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progression</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Message d'erreur */}
              {error && (
                <div className="flex gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Erreur</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              )}

              {/* Résultats */}
              {results && (
                <div className="space-y-4">
                  <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">Classification terminée !</p>
                      <p className="text-sm text-green-800">
                        {results.classified} ressources classées, {results.skipped} déjà classées
                      </p>
                    </div>
                  </div>



                  {/* Statistiques globales */}
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">{results.classified}</div>
                        <p className="text-xs text-muted-foreground">Classées</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600">{results.skipped}</div>
                        <p className="text-xs text-muted-foreground">Déjà classées</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600">{results.total}</div>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ℹ️ Comment ça fonctionne ?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p>
                La classification automatique utilise un algorithme intelligent qui :
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Analyse le titre, la description et les tags de chaque ressource</li>
                <li>Compare avec les descriptions des collections disponibles</li>
                <li>Attribue un score de pertinence pour chaque collection</li>
                <li>Place la ressource dans la collection avec le meilleur score</li>
                <li>Ignore les ressources déjà classées</li>
              </ul>
              <p className="pt-2">
                Vous pouvez toujours ajuster manuellement les classifications via la page de gestion des collections.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
