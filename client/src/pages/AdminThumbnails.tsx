import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle2, Loader2, SkipForward } from "lucide-react";

export default function AdminThumbnails() {
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateThumbnailsMutation = trpc.admin.generateThumbnails.useMutation({
    onSuccess: (data) => {
      setResults(data);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const isGenerating = generateThumbnailsMutation.isPending;
  const summary = results?.summary;
  const resultItems = Array.isArray(results?.results) ? results.results : [];

  const handleGenerateThumbnails = async () => {
    setError(null);
    setResults(null);

    try {
      await generateThumbnailsMutation.mutateAsync({
        resourceIds: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Génération des miniatures</h1>
        <p className="text-gray-600 mt-2">
          Générez automatiquement des miniatures et aperçus pour les ressources qui en ont besoin
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Générer les miniatures</CardTitle>
          <CardDescription>
            Cette opération lance la génération des miniatures et aperçus pour les ressources
            qui n’en disposent pas encore.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerateThumbnails}
            disabled={isGenerating}
            size="lg"
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              "Générer les miniatures"
            )}
          </Button>

          {summary && (
            <div className="space-y-4 mt-6">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Génération terminée : {summary.success ?? 0} réussies, {summary.skipped ?? 0} ignorées, {summary.failed ?? 0} erreurs
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {summary.success ?? 0}
                      </div>
                      <p className="text-sm text-gray-600">Réussies</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {summary.skipped ?? 0}
                      </div>
                      <p className="text-sm text-gray-600">Ignorées</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {summary.failed ?? 0}
                      </div>
                      <p className="text-sm text-gray-600">Erreurs</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                <h3 className="font-semibold">Détails :</h3>
                {resultItems.map((result: any, index: number) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg text-sm ${
                      result.status === "success"
                        ? "bg-green-50 text-green-800"
                        : result.status === "skipped"
                          ? "bg-yellow-50 text-yellow-800"
                          : "bg-red-50 text-red-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {result.status === "success" && (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {result.status === "skipped" && (
                        <SkipForward className="h-4 w-4" />
                      )}
                      {result.status === "error" && (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span>
                        Ressource #{result.resourceId} - {result.status}
                        {result.message && ` : ${result.message}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}