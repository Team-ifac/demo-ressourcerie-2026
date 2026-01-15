import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc';

interface ImportResource {
  title: string;
  summary: string;
  content: string;
  type: string;
  visibility: string;
  accessLevel: string;
  status: string;
  profiles: string[];
  fileUrl: string;
  fileName: string;
  folder: string;
}

export function AdminImportPDFs() {
  const [resources, setResources] = useState<ImportResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Charger le fichier JSON d'import au démarrage
  useEffect(() => {
    const loadResources = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/import-resources.json');
        if (!response.ok) {
          throw new Error('Impossible de charger le fichier d\'import');
        }
        const data = await response.json();
        setResources(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadResources();
  }, []);

  const importMutation = trpc.admin.importPDFBulk.useMutation();

  const handleImport = async () => {
    if (resources.length === 0) {
      alert('Aucune ressource à importer');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importMutation.mutateAsync({ resources });
      setImportResult(result);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des ressources');
    } finally {
      setIsImporting(false);
    }
  };

  const techniquesCount = resources.filter(r => r.folder === 'Techniques d\'animation').length;
  const formateurCount = resources.filter(r => r.folder === 'Pour formateurs seulement').length;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Import en masse des PDFs</h1>
        <p className="text-gray-600 mt-2">Importer les ressources PDF depuis Google Drive</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Chargement des ressources...</span>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{resources.length}</div>
                <p className="text-xs text-gray-600 mt-1">ressources à importer</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Techniques d'animation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{techniquesCount}</div>
                <p className="text-xs text-gray-600 mt-1">tous les profils</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Pour formateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">{formateurCount}</div>
                <p className="text-xs text-gray-600 mt-1">formateurs uniquement</p>
              </CardContent>
            </Card>
          </div>

          {/* Détails des ressources */}
          <Card>
            <CardHeader>
              <CardTitle>Ressources à importer</CardTitle>
              <CardDescription>
                {resources.length} fichiers PDF prêts à être importés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <FileText className="w-4 h-4 mt-1 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{resource.title}</p>
                      <p className="text-xs text-gray-600">
                        {resource.folder} • {resource.profiles.join(', ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bouton d'import */}
          <div className="flex gap-4">
            <Button
              onClick={handleImport}
              disabled={isImporting || resources.length === 0}
              className="flex-1"
              size="lg"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Import en cours...
                </>
              ) : (
                `Importer ${resources.length} ressources`
              )}
            </Button>
          </div>

          {/* Résultats d'import */}
          {importResult && (
            <Card className={importResult.failed === 0 ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {importResult.failed === 0 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="text-green-900">Import réussi !</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="text-orange-900">Import partiel</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Importées</p>
                    <p className="text-2xl font-bold text-green-600">{importResult.imported}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Échouées</p>
                    <p className="text-2xl font-bold text-red-600">{importResult.failed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{importResult.total}</p>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <div className="font-semibold mb-2">Erreurs lors de l'import :</div>
                      <ul className="space-y-1 text-sm">
                        {importResult.errors.map((error: string, idx: number) => (
                          <li key={idx}>• {error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="text-sm text-gray-600">
                  <p className="font-semibold mb-2">Détails :</p>
                  <ul className="space-y-1">
                    {importResult.results
                      .filter((r: any) => r.status === 'success')
                      .slice(0, 5)
                      .map((r: any, idx: number) => (
                        <li key={idx} className="text-green-700">
                          ✓ {r.fileName}
                        </li>
                      ))}
                    {importResult.results.filter((r: any) => r.status === 'success').length > 5 && (
                      <li className="text-gray-600">
                        ... et {importResult.results.filter((r: any) => r.status === 'success').length - 5} autres
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
