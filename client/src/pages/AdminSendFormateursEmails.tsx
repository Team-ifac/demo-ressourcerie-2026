import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { AlertCircle, CheckCircle, Mail, Loader } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Redirect } from "wouter";

export default function AdminSendFormateursEmails() {
  const { user, loading: authLoading } = useAuth();
  const [selectedFormateurs, setSelectedFormateurs] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState<{ sent: number; failed: number; errors?: string[] } | null>(null);

  // Récupérer la liste des formateurs
  const { data: formateurs = [], isLoading: isLoadingFormateurs } = trpc.admin.getFormateurs.useQuery(undefined, {
    enabled: user?.role === "admin",
  });

  const sendEmailsMutation = trpc.admin.sendFormateursEmails.useMutation();
  const loading = sendEmailsMutation.isPending;

  const handleSelectAll = () => {
    if (selectedFormateurs.size === formateurs.length) {
      setSelectedFormateurs(new Set());
    } else {
      setSelectedFormateurs(new Set(formateurs.map((f: any) => f.id)));
    }
  };

  const handleSelectFormateur = (id: number) => {
    const newSelected = new Set(selectedFormateurs);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedFormateurs(newSelected);
  };

  const handleSendEmails = async () => {
    if (selectedFormateurs.size === 0) {
      setError("Veuillez sélectionner au moins un formateur");
      return;
    }

    setError("");

    try {
      const sendResult = await sendEmailsMutation.mutateAsync({
        userIds: Array.from(selectedFormateurs),
      });
      setResult(sendResult);
      setSuccess(true);
      setSelectedFormateurs(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'envoi des emails");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Chargement...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  if (success && result) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50/50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle>Emails envoyés !</CardTitle>
              <CardDescription>
                {result.sent} email(s) envoyé(s) avec succès
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-green-100 rounded-lg">
                  <div className="text-2xl font-bold text-green-900">{result.sent}</div>
                  <p className="text-sm text-green-800">Envoyés</p>
                </div>
                <div className="p-4 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-900">{result.failed}</div>
                  <p className="text-sm text-red-800">Échoués</p>
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

              <Button
                onClick={() => {
                  setSuccess(false);
                  setResult(null);
                  setError("");
                }}
                className="w-full"
              >
                Envoyer d'autres emails
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="container max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Envoyer les emails d'activation aux formateurs</CardTitle>
            <CardDescription>
              Sélectionnez les formateurs à qui envoyer l'email d'activation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isLoadingFormateurs ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : formateurs.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Aucun formateur trouvé</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedFormateurs.size === formateurs.length && formateurs.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <span className="font-semibold">
                        Sélectionner tout ({selectedFormateurs.size}/{formateurs.length})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
                    {formateurs.map((formateur: any) => (
                      <div
                        key={formateur.id}
                        className="flex items-center gap-3 p-3 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Checkbox
                          checked={selectedFormateurs.has(formateur.id)}
                          onCheckedChange={() => handleSelectFormateur(formateur.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">
                            {formateur.firstName} {formateur.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{formateur.email}</p>
                        </div>
                        {formateur.passwordResetToken && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Prêt
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">ℹ️ Information :</h4>
                  <p className="text-sm text-blue-800">
                    Les formateurs sélectionnés recevront un email avec un lien d'activation pour définir leur mot de passe.
                  </p>
                </div>

                <Button
                  onClick={handleSendEmails}
                  disabled={selectedFormateurs.size === 0 || loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Envoyer les emails ({selectedFormateurs.size})
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
