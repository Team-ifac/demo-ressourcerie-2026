import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Trash2, Search } from 'lucide-react';

export default function AdminDeduplication() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [keepBest, setKeepBest] = useState(true);

  // Analyser les doublons
  const analyzeQuery = trpc.deduplication.analyze.useQuery();

  // Supprimer les doublons
  const removeMutation = trpc.deduplication.remove.useMutation({
    onSuccess: () => {
      // Invalider la requête d'analyse
      analyzeQuery.refetch?.();
      setShowConfirm(false);
    },
  });

  const handleRemove = async () => {
    if (showConfirm) {
      // Deuxième clic : exécuter la suppression
      await removeMutation.mutateAsync({
        dryRun: false,
        keepBest,
      });
    } else {
      // Premier clic : afficher la confirmation
      setShowConfirm(true);
    }
  };

  const report = analyzeQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Déduplication des Ressources</h1>
        <p className="text-gray-600 mt-2">
          Identifiez et supprimez les ressources dupliquées basées sur le titre
        </p>
      </div>

      {/* Résumé */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total de ressources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.totalResources}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ressources uniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.uniqueResources}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Doublons trouvés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{report.totalDuplicates}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Groupes de doublons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.duplicateGroups.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boutons d'action */}
      {report && report.totalDuplicates > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Attention : Doublons détectés
            </CardTitle>
            <CardDescription>
              {report.totalDuplicates} ressources dupliquées peuvent être supprimées
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={keepBest}
                  onChange={(e) => setKeepBest(e.target.checked)}
                  className="w-4 h-4"
                />
                <span>Garder la ressource la plus complète (recommandé)</span>
              </label>
            </div>

            {showConfirm ? (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  ⚠️ Cliquez à nouveau pour confirmer la suppression de {report.totalDuplicates} ressources
                </AlertDescription>
              </Alert>
            ) : null}

            <Button
              onClick={handleRemove}
              disabled={removeMutation.isPending}
              variant={showConfirm ? 'destructive' : 'default'}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {removeMutation.isPending
                ? 'Suppression en cours...'
                : showConfirm
                  ? 'Confirmer la suppression'
                  : 'Supprimer les doublons'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Résultats de la suppression */}
      {removeMutation.data && (
        <Alert className={removeMutation.data.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <AlertDescription className={removeMutation.data.success ? 'text-green-800' : 'text-red-800'}>
            {removeMutation.data.message}
            {removeMutation.data.resourcesDeleted > 0 && (
              <div className="mt-2">
                {removeMutation.data.resourcesDeleted} ressources supprimées
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Liste des doublons */}
      {report && report.duplicateGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Groupes de doublons détectés</h2>
          
          {report.duplicateGroups.slice(0, 10).map((group, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">
                  {group.title || '(sans titre)'}
                </CardTitle>
                <CardDescription>
                  {group.count} copies trouvées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {group.contentLengths.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm p-2 bg-gray-50 rounded">
                      <span>ID {item.id}</span>
                      <span className="text-gray-600">
                        {item.totalLength} caractères
                        {item.totalLength === Math.max(...group.contentLengths.map(c => c.totalLength)) && (
                          <span className="ml-2 text-green-600 font-semibold">(À garder)</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {report.duplicateGroups.length > 10 && (
            <p className="text-sm text-gray-600">
              ... et {report.duplicateGroups.length - 10} autres groupes de doublons
            </p>
          )}
        </div>
      )}

      {/* Message si pas de doublons */}
      {report && report.totalDuplicates === 0 && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            ✅ Aucun doublon détecté ! Votre base de données est propre.
          </AlertDescription>
        </Alert>
      )}

      {/* Chargement */}
      {analyzeQuery.isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}
