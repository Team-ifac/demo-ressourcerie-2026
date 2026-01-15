import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle2, Copy, Smartphone, MessageSquare, Loader } from "lucide-react";

type TwoFactorMethod = "totp" | "sms" | null;

export function TwoFactorAuth() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [secret, setSecret] = useState("JBSWY3DPEBLW64TMMQ======");
  const [qrCode, setQrCode] = useState("https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/IFAC:user@example.com?secret=JBSWY3DPEBLW64TMMQ====");

  const handleEnableTOTP = async () => {
    try {
      setIsLoading(true);
      // Simulation d'activation TOTP
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSelectedMethod("totp");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyTOTP = async () => {
    if (verificationCode.length !== 6) {
      alert("Le code doit contenir 6 chiffres");
      return;
    }
    try {
      setIsLoading(true);
      // Simulation de vérification
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsEnabled(true);
      setSelectedMethod(null);
      setVerificationCode("");
      alert("2FA activé avec succès !");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (confirm("Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ?")) {
      try {
        setIsLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsEnabled(false);
        alert("2FA désactivé");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(secret);
    alert("Secret copié dans le presse-papiers !");
  };

  if (isEnabled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <CardTitle>Authentification à deux facteurs activée</CardTitle>
                <CardDescription>Votre compte est protégé</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-green-200">
            <AlertCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Vous devrez entrer un code de vérification en plus de votre mot de passe lors de la connexion.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleDisable2FA} disabled={isLoading}>
            {isLoading ? "Désactivation..." : "Désactiver 2FA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (selectedMethod === "totp") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurer l'authentification TOTP</CardTitle>
          <CardDescription>
            Utilisez une application d'authentification pour générer des codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Téléchargez une application d'authentification comme Google Authenticator, Authy ou Microsoft Authenticator
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-4">1. Scannez ce code QR</h3>
              <div className="border rounded-lg p-4 bg-muted flex justify-center">
                <img src={qrCode} alt="QR Code" className="h-48 w-48" />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">2. Ou entrez ce secret manuellement</h3>
              <div className="flex gap-2">
                <Input value={secret} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">3. Entrez le code de vérification</h3>
              <Input
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="font-mono text-lg tracking-widest"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleVerifyTOTP}
              disabled={isLoading || verificationCode.length !== 6}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Vérification...
                </>
              ) : (
                "Vérifier et activer"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedMethod(null);
                setVerificationCode("");
              }}
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentification à deux facteurs</CardTitle>
        <CardDescription>
          Renforcez la sécurité de votre compte avec une deuxième couche de protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            L'authentification à deux facteurs ajoute une couche de sécurité supplémentaire à votre compte.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="totp" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="gap-2">
              <Smartphone className="h-4 w-4" />
              <span className="hidden sm:inline">Authenticator</span>
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">SMS</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="totp" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Utilisez une application d'authentification pour générer des codes de vérification
            </p>
            <Button onClick={handleEnableTOTP} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                  Configuration...
                </>
              ) : (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Activer Authenticator
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Recevez les codes de vérification par SMS
            </p>
            <Alert>
              <AlertDescription>
                La vérification par SMS sera disponible prochainement.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
