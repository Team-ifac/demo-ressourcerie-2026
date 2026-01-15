import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QrCode, Download, Loader } from "lucide-react";

interface QRCodeGeneratorProps {
  resourceId: number;
  resourceTitle: string;
  url: string;
}

export function QRCodeGenerator({
  resourceId,
  resourceTitle,
  url,
}: QRCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  const generateQRCode = async () => {
    setIsGenerating(true);
    try {
      // Utiliser l'API QR Code de Google Charts (gratuit et sans dépendances)
      const fullUrl = `${window.location.origin}${url}`;
      const encodedUrl = encodeURIComponent(fullUrl);
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUrl}`;
      setQrCodeUrl(qrUrl);
    } catch (error) {
      console.error("Erreur lors de la génération du QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeUrl) return;

    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `qr-code-${resourceId}-${resourceTitle.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <QrCode className="h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code - {resourceTitle}</DialogTitle>
          <DialogDescription>
            Scannez ce code pour accéder directement à la ressource
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!qrCodeUrl ? (
            <div className="flex flex-col items-center justify-center py-8">
              <QrCode className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Cliquez sur le bouton ci-dessous pour générer le QR code
              </p>
              <Button onClick={generateQRCode} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  "Générer le QR Code"
                )}
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="w-64 h-64"
                />
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  onClick={downloadQRCode}
                  className="flex-1 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Télécharger
                </Button>
                <Button
                  onClick={() => setQrCodeUrl(null)}
                  variant="outline"
                  className="flex-1"
                >
                  Réinitialiser
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                URL encodée : {window.location.origin}{url}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
