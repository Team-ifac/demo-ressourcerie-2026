import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Loader2, Info } from "lucide-react";

export default function AdminCollectionAssociation() {
  const [minScore, setMinScore] = useState(40);
  const [overwrite, setOverwrite] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const associateMutation = trpc.collectionAssociation.autoAssociate.useMutation();

  const handleAssociate = async () => {
    setIsRunning(true);
    try {
      const result = await associateMutation.mutateAsync({
        minScore,
        overwrite,
      });

      if (!result.success) {
        console.error("Erreur lors de l'association:", result.message);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const result = associateMutation.data;
  const error = associateMutation.error;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Association Automatique des Ressources</h1>
        <p className="text-gray-600 mb-6">
          Associez automatiquement les ressources aux collections thématiques basées sur leurs tags et type.
        </p>

        <div className="grid gap-6">
          {/* Paramètres */}
          <Card>
            <CardHeader>
              <CardTitle>Paramètres</CardTitle>
              <CardDescription>Configurez les critères d'association</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score minimum */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium">Score minimum requis</label>
                  <span className="text-lg font-bold text-blue-600">{minScore}</span>
                </div>
                <Slider
                  value={[minScore]}
                  onValueChange={(value) => setMinScore(value[0])}
                  min={0}
                  max={100}
                  step={5}
                  disabled={isRunning}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Plus le score est élevé, plus les associations seront strictes. Minimum recommandé: 40
                </p>
              </div>

              {/* Overwrite */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite"
                  checked={overwrite}
                  onCheckedChange={(checked) => setOverwrite(checked as boolean)}
                  disabled={isRunning}
                />
                <label htmlFor="overwrite" className="text-sm font-medium cursor-pointer">
                  Remplacer les associations existantes
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Information */}
          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Fonctionnement :</strong> L'association automatique analyse chaque ressource et la lie à la collection thématique la plus appropriée basée sur :
              <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                <li>Type de ressource (30 points)</li>
                <li>Catégorie (25 points)</li>
                <li>Keywords dans le titre/résumé (25 points)</li>
                <li>Tags associés (20 points)</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Bouton d'action */}
          <Button
            onClick={handleAssociate}
            disabled={isRunning}
            size="lg"
            className="w-full"
          >
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Association en cours...
              </>
            ) : (
              "Lancer l'association automatique"
            )}
          </Button>

          {/* Résultats */}
          {result && (
            <Alert className={result.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <CheckCircle className={`h-4 w-4 ${result.success ? "text-green-600" : "text-red-600"}`} />
              <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                <strong>{result.message}</strong>
                {result.success && (
                  <div className="mt-2 space-y-1">
                    <p>✓ Associations créées: <strong>{result.associationsCreated}</strong></p>
                    <p>⊘ Associations ignorées: <strong>{result.associationsSkipped}</strong></p>
                    {result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="font-semibold">Erreurs:</p>
                        <ul className="list-disc list-inside text-sm">
                          {result.errors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>... et {result.errors.length - 5} autres erreurs</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Erreur */}
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Erreur:</strong> {error.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Collections thématiques */}
          <Card>
            <CardHeader>
              <CardTitle>Collections thématiques disponibles</CardTitle>
              <CardDescription>Les ressources seront associées à ces collections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">🎮 Jeux collectifs</h4>
                  <p className="text-xs text-gray-600">Jeux et activités favorisant la coopération</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">✂️ Activités manuelles</h4>
                  <p className="text-xs text-gray-600">Ateliers créatifs et activités manuelles</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">📚 Formation BAFA</h4>
                  <p className="text-xs text-gray-600">Ressources pour la formation BAFA/BAFD</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">🌿 Environnement et nature</h4>
                  <p className="text-xs text-gray-600">Activités axées sur la nature</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">🎭 Expression artistique</h4>
                  <p className="text-xs text-gray-600">Activités d'expression et création artistique</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">⚖️ Gestion des conflits</h4>
                  <p className="text-xs text-gray-600">Outils pour gérer les situations conflictuelles</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm">🏠 Vie quotidienne</h4>
                  <p className="text-xs text-gray-600">Activités pour la vie quotidienne en ACM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
