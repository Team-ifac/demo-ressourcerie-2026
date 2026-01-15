import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Download, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function AdminImport() {
  const [importType, setImportType] = useState<"csv" | "json">("csv");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const importMutation = trpc.admin.importResources.useMutation();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setIsImporting(true);
    setError(null);
    setResult(null);

    try {
      const content = await file.text();
      const importResult = await importMutation.mutateAsync({
        type: importType,
        content,
      });

      setResult(importResult);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const content =
      importType === "csv"
        ? `title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public
"Animation pour tous","Description de la ressource","Contenu détaillé","Animation","https://example.com/file.pdf","file.pdf","pdf","John Doe","animation;enfants;jeux","true"
"Formation développement","Ressource de formation","Contenu détaillé","Formation","https://example.com/file2.pdf","file2.pdf","pdf","Jane Smith","formation;développement","true"`
        : JSON.stringify(
            [
              {
                title: "Animation pour tous",
                description: "Description de la ressource",
                content: "Contenu détaillé",
                thematic: "Animation",
                fileUrl: "https://example.com/file.pdf",
                fileName: "file.pdf",
                fileType: "pdf",
                authorName: "John Doe",
                tags: ["animation", "enfants", "jeux"],
                isPublic: true,
              },
              {
                title: "Formation développement",
                description: "Ressource de formation",
                content: "Contenu détaillé",
                thematic: "Formation",
                fileUrl: "https://example.com/file2.pdf",
                fileName: "file2.pdf",
                fileType: "pdf",
                authorName: "Jane Smith",
                tags: ["formation", "développement"],
                isPublic: true,
              },
            ],
            null,
            2
          );

    const blob = new Blob([content], {
      type: importType === "csv" ? "text/csv" : "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template.${importType}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Import de Ressources</h1>

        {/* Type Selection */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Format d'import</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="csv"
                checked={importType === "csv"}
                onChange={(e) => setImportType(e.target.value as "csv" | "json")}
              />
              <span>CSV</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="json"
                checked={importType === "json"}
                onChange={(e) => setImportType(e.target.value as "csv" | "json")}
              />
              <span>JSON</span>
            </label>
          </div>
        </Card>

        {/* File Upload */}
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Sélectionner un fichier</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Glissez-déposez votre fichier ou cliquez pour sélectionner
            </p>
            <input
              type="file"
              accept={importType === "csv" ? ".csv" : ".json"}
              onChange={handleFileChange}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button variant="outline" asChild>
                <span>Sélectionner un fichier</span>
              </Button>
            </label>
          </div>

          {file && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-blue-900">{file.name}</p>
              <p className="text-xs text-blue-700">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <Button onClick={downloadTemplate} variant="outline" className="w-full mb-4">
            <Download className="w-4 h-4 mr-2" />
            Télécharger le modèle
          </Button>

          <Button
            onClick={handleImport}
            disabled={!file || isImporting}
            className="w-full"
          >
            {isImporting ? "Import en cours..." : "Importer les ressources"}
          </Button>
        </Card>

        {/* Results */}
        {result && (
          <Card className="p-6 mb-6 border-green-200 bg-green-50">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Import réussi</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>✓ {result.success} ressource(s) importée(s)</p>
                  {result.failed > 0 && (
                    <>
                      <p>✗ {result.failed} erreur(s)</p>
                      {result.errors && result.errors.length > 0 && (
                        <div className="mt-3 bg-white rounded p-3 max-h-40 overflow-y-auto">
                          {result.errors.map((err: any, idx: number) => (
                            <p key={idx} className="text-xs text-red-600">
                              Ligne {err.row || idx}: {err.error}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="p-6 mb-6 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-red-900 mb-2">Erreur</h3>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold mb-2">Format CSV</h3>
              <p className="text-xs bg-gray-50 p-2 rounded font-mono">
                title,description,content,thematic,file_url,file_name,file_type,author_name,tags,is_public
              </p>
              <p className="mt-2">
                Les tags doivent être séparés par des points-virgules (;)
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Format JSON</h3>
              <p className="text-xs bg-gray-50 p-2 rounded font-mono">
                [{"{ title, description, ... }"}]
              </p>
              <p className="mt-2">
                Les tags doivent être un tableau de chaînes
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Champs requis</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>title</strong> : Titre de la ressource (obligatoire)
                </li>
                <li>
                  <strong>description</strong> : Description courte
                </li>
                <li>
                  <strong>thematic</strong> : Thématique (Animation, Formation, etc.)
                </li>
                <li>
                  <strong>tags</strong> : Tags séparés par des points-virgules
                </li>
                <li>
                  <strong>fileUrl</strong> : URL du fichier PDF
                </li>
                <li>
                  <strong>isPublic</strong> : true ou false (défaut: true)
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
