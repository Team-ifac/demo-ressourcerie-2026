import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Upload, Loader } from "lucide-react";

export default function AdminImportFormateurs() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors?: string[] } | null>(null);

  const importMutation = trpc.admin.importFormateurs.useMutation();
  const loading = importMutation.isPending;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const name = selectedFile.name.toLowerCase();

    const isAllowed =
      name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".csv");

    if (!isAllowed) {
      setError("Veuillez sélectionner un fichier .xlsx, .xls ou .csv");
      setFile(null);
      setSuccess(false);
      setResult(null);
      return;
    }

    setFile(selectedFile);
    setError("");
    setSuccess(false);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      const binaryString = Array.from(uint8Array)
        .map((byte) => String.fromCharCode(byte))
        .join("");
      const base64 = btoa(binaryString);
      const importResult = await importMutation.mutateAsync({ file: base64 });

      setResult(importResult);
      setSuccess(true);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import");
    }
  };

  if (success && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle>Import complété !</CardTitle>
              <CardDescription>
                {result.success} formateur(s) importé(s) avec succès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{result.success}</div>
                  <p className="text-sm text-green-800">Réussis</p>
                </div>
                <div className="p-4 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                  <p className="text-sm text-red-800">Échoués</p>
                </div>
                <div className="p-4 bg-blue-100 rounded-lg">
                  <div className="text-2xl font-bold text-blue-900">{result.success + result.failed}</div>
                  <p className="text-sm text-blue-800">Total</p>
                </div>
              </div>

              {(result.errors?.length ?? 0) > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Erreurs :</h4>
                  <ul className="space-y-1 text-sm text-red-800">
                    {(result.errors ?? []).map((error, idx) => (
                      <li key={idx}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h4>
                <ol className="space-y-2 text-sm text-blue-800 list-decimal list-inside">
                  <li>Les formateurs ont reçu un email avec un lien d'activation</li>
                  <li>Ils doivent cliquer sur le lien pour définir leur mot de passe</li>
                  <li>Ensuite, ils peuvent se connecter avec leur email et mot de passe</li>
                </ol>
              </div>

              <Button onClick={() => {
                setSuccess(false);
                setResult(null);
                setFile(null);
              }} className="w-full">
                Importer d'autres formateurs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="container max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Importer les formateurs</CardTitle>
            <CardDescription>
              Téléchargez un fichier Excel pour créer les comptes des formateurs en masse
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Format du fichier :</h4>
                  <p className="text-sm text-blue-800 mb-3">
                    Le fichier Excel doit contenir les colonnes suivantes :
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li><strong>Nom</strong> - Nom de famille du formateur</li>
                    <li><strong>Prénom</strong> - Prénom du formateur</li>
                    <li><strong>Email perso</strong> - Email personnel (utilisé pour la connexion)</li>
                    <li><strong>Identifiant</strong> - Identifiant (optionnel)</li>
                    <li><strong>Mot de passe Teams</strong> - Mot de passe (optionnel, non utilisé)</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file">Sélectionner le fichier Excel</Label>
                  <div className="flex gap-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileChange}
                      disabled={loading}
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Fichier prêt
                    </Button>
                  </div>
                  {file && (
                    <p className="text-sm text-muted-foreground">
                      ✓ Fichier sélectionné : {file.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h4 className="font-semibold text-amber-900 mb-2">⚠️ Important :</h4>
                <ul className="text-sm text-amber-800 space-y-1 list-disc list-inside">
                  <li>Les formateurs recevront un email avec un lien d'activation</li>
                  <li>Ils devront cliquer sur le lien pour définir leur mot de passe</li>
                  <li>Les mots de passe Teams ne seront pas stockés</li>
                  <li>Chaque formateur aura son propre compte avec email/mot de passe</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={!file || loading}>
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Import en cours...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importer les formateurs
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
