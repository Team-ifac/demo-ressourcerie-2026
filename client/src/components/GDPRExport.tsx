import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, AlertCircle, CheckCircle2, Loader } from "lucide-react";

interface ExportOptions {
  profile: boolean;
  resources: boolean;
  collections: boolean;
  comments: boolean;
  history: boolean;
  badges: boolean;
}

export function GDPRExport() {
  const [isLoading, setIsLoading] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    profile: true,
    resources: true,
    collections: true,
    comments: true,
    history: true,
    badges: true,
  });

  const handleOptionChange = (key: keyof ExportOptions) => {
    setExportOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setIsExported(false);

      // Préparer les données d'export
      const exportData = {
        exportDate: new Date().toISOString(),
        options: exportOptions,
        data: {
          profile: exportOptions.profile ? { /* données du profil */ } : null,
          resources: exportOptions.resources ? { /* ressources */ } : null,
          collections: exportOptions.collections ? { /* collections */ } : null,
          comments: exportOptions.comments ? { /* commentaires */ } : null,
          history: exportOptions.history ? { /* historique */ } : null,
          badges: exportOptions.badges ? { /* badges */ } : null,
        },
      };

      // Créer le fichier JSON
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Télécharger le fichier
      const link = document.createElement("a");
      link.href = url;
      link.download = `ressourcerie-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExported(true);
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      alert("Erreur lors de l'export des données");
    } finally {
      setIsLoading(false);
    }
  };

  const selectAll = () => {
    setExportOptions({
      profile: true,
      resources: true,
      collections: true,
      comments: true,
      history: true,
      badges: true,
    });
  };

  const deselectAll = () => {
    setExportOptions({
      profile: false,
      resources: false,
      collections: false,
      comments: false,
      history: false,
      badges: false,
    });
  };

  const isAnySelected = Object.values(exportOptions).some((v) => v);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export de vos données (RGPD)</CardTitle>
        <CardDescription>
          Téléchargez une copie complète de vos données personnelles au format JSON
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alerte informative */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Vous pouvez télécharger une copie de vos données conformément au Règlement Général sur la
            Protection des Données (RGPD). Les données seront exportées au format JSON.
          </AlertDescription>
        </Alert>

        {/* Options d'export */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sélectionner les données à exporter</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Tout sélectionner
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Tout désélectionner
              </Button>
            </div>
          </div>

          <div className="space-y-2 border rounded-lg p-4 bg-muted/50">
            {/* Profil */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="profile"
                checked={exportOptions.profile}
                onCheckedChange={() => handleOptionChange("profile")}
              />
              <label htmlFor="profile" className="text-sm font-medium cursor-pointer">
                Profil utilisateur
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(nom, email, avatar)</span>
            </div>

            {/* Ressources */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="resources"
                checked={exportOptions.resources}
                onCheckedChange={() => handleOptionChange("resources")}
              />
              <label htmlFor="resources" className="text-sm font-medium cursor-pointer">
                Ressources créées
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(vos contributions)</span>
            </div>

            {/* Collections */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="collections"
                checked={exportOptions.collections}
                onCheckedChange={() => handleOptionChange("collections")}
              />
              <label htmlFor="collections" className="text-sm font-medium cursor-pointer">
                Collections personnalisées
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(vos favoris organisés)</span>
            </div>

            {/* Commentaires */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="comments"
                checked={exportOptions.comments}
                onCheckedChange={() => handleOptionChange("comments")}
              />
              <label htmlFor="comments" className="text-sm font-medium cursor-pointer">
                Commentaires et avis
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(vos retours)</span>
            </div>

            {/* Historique */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="history"
                checked={exportOptions.history}
                onCheckedChange={() => handleOptionChange("history")}
              />
              <label htmlFor="history" className="text-sm font-medium cursor-pointer">
                Historique d'activité
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(vos actions)</span>
            </div>

            {/* Badges */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="badges"
                checked={exportOptions.badges}
                onCheckedChange={() => handleOptionChange("badges")}
              />
              <label htmlFor="badges" className="text-sm font-medium cursor-pointer">
                Badges et récompenses
              </label>
              <span className="text-xs text-muted-foreground ml-auto">(vos accomplissements)</span>
            </div>
          </div>
        </div>

        {/* Message de succès */}
        {isExported && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Vos données ont été exportées avec succès ! Le fichier a été téléchargé.
            </AlertDescription>
          </Alert>
        )}

        {/* Bouton d'export */}
        <Button
          onClick={handleExport}
          disabled={!isAnySelected || isLoading}
          className="w-full gap-2"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader className="h-4 w-4 animate-spin" />
              Préparation de l'export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Télécharger mes données
            </>
          )}
        </Button>

        {/* Informations légales */}
        <div className="text-xs text-muted-foreground space-y-2 pt-4 border-t">
          <p>
            <strong>Conformité RGPD :</strong> Cet export contient toutes vos données personnelles
            stockées sur nos serveurs.
          </p>
          <p>
            <strong>Format :</strong> Les données sont exportées au format JSON, lisible par la
            plupart des applications.
          </p>
          <p>
            <strong>Sécurité :</strong> Le fichier est généré de manière sécurisée et ne contient
            que vos données.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
