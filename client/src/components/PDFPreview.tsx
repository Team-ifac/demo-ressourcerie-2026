import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, X, ChevronLeft, ChevronRight, Loader } from "lucide-react";

interface PDFPreviewProps {
  fileUrl: string;
  fileName?: string;
  onDownload?: () => void;
}

export function PDFPreview({ fileUrl, fileName = "document.pdf", onDownload }: PDFPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;
      link.click();
    }
  };

  return (
    <>
      {/* Aperçu compact */}
      {!isExpanded && (
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setIsExpanded(true)}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-8 w-8 text-blue-500 shrink-0 mt-1" />
                <div className="flex-1">
                  <CardTitle className="line-clamp-1">{fileName}</CardTitle>
                  <CardDescription>Cliquez pour prévisualiser</CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="shrink-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Prévisualisation en plein écran */}
      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between shrink-0">
              <div>
                <CardTitle>{fileName}</CardTitle>
                <CardDescription>Page {currentPage} sur {totalPages}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>

            <CardContent className="flex-1 overflow-auto flex flex-col items-center justify-center bg-muted/50">
              {isLoading && (
                <div className="flex flex-col items-center gap-2">
                  <Loader className="h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Chargement du PDF...</p>
                </div>
              )}

              {/* Utiliser un iframe pour afficher le PDF */}
              <iframe
                src={`${fileUrl}#page=${currentPage}`}
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
                title="PDF Preview"
              />
            </CardContent>

            <div className="flex items-center justify-between gap-4 p-4 border-t shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
