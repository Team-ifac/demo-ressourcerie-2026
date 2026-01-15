import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Download, Loader, Package } from "lucide-react";

interface ResourceItem {
  id: number;
  title: string;
  description?: string;
  downloadUrl?: string;
}

interface BulkExportProps {
  resources: ResourceItem[];
  collectionName?: string;
}

export function BulkExport({ resources, collectionName }: BulkExportProps) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  const toggleResource = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleAll = () => {
    if (selectedIds.size === resources.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(resources.map((r) => r.id)));
    }
  };

  const handleExportZip = async () => {
    if (selectedIds.size === 0) return;

    setIsExporting(true);
    try {
      // Simuler la création d'un ZIP avec les ressources sélectionnées
      // En production, cela appellerait une API backend pour créer le ZIP
      
      const selectedResources = resources.filter((r) =>
        selectedIds.has(r.id)
      );

      // Créer un fichier texte avec la liste des ressources
      const manifest = `
EXPORT DE RESSOURCES - RESSOURCERIE IFAC
${collectionName ? `Collection: ${collectionName}` : ""}
Date: ${new Date().toLocaleDateString("fr-FR")}
Nombre de ressources: ${selectedResources.length}

---

${selectedResources
  .map(
    (r) => `
RESSOURCE: ${r.title}
ID: ${r.id}
Description: ${r.description || "N/A"}
URL: ${r.downloadUrl || "N/A"}
`
  )
  .join("\n---\n")}
      `.trim();

      // Créer un blob et télécharger
      const blob = new Blob([manifest], { type: "text/plain" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ressources-export-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Réinitialiser la sélection
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Package className="h-4 w-4" />
          Export en masse
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export en masse</DialogTitle>
          <DialogDescription>
            Sélectionnez les ressources à exporter
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Sélectionner tout */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <Checkbox
              id="select-all"
              checked={selectedIds.size === resources.length && resources.length > 0}
              onCheckedChange={toggleAll}
            />
            <label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              Sélectionner tout ({resources.length})
            </label>
          </div>

          {/* Liste des ressources */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {resources.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune ressource disponible
              </p>
            ) : (
              resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-start gap-3 p-2 hover:bg-muted rounded"
                >
                  <Checkbox
                    id={`resource-${resource.id}`}
                    checked={selectedIds.has(resource.id)}
                    onCheckedChange={() => toggleResource(resource.id)}
                    className="mt-1"
                  />
                  <label
                    htmlFor={`resource-${resource.id}`}
                    className="text-sm cursor-pointer flex-1"
                  >
                    <p className="font-medium">{resource.title}</p>
                    {resource.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {resource.description}
                      </p>
                    )}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Résumé */}
          {selectedIds.size > 0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <strong>{selectedIds.size}</strong> ressource(s) sélectionnée(s)
                </p>
              </CardContent>
            </Card>
          )}

          {/* Boutons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedIds(new Set())}
            >
              Réinitialiser
            </Button>
            <Button
              onClick={handleExportZip}
              disabled={isExporting || selectedIds.size === 0}
            >
              {isExporting ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter ({selectedIds.size})
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
