import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

const useToast = () => {
  return {
    toast: (props: any) => {
      if (props.variant === 'destructive') {
        console.error(props.title, props.description);
      } else {
        console.log(props.title, props.description);
      }
    },
  };
};

export function AuthVerifyEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const verifyEmailMutation = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Votre email a été vérifié avec succès !");
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    },
    onError: (error: any) => {
      setStatus("error");
      setMessage(error?.message || "Erreur lors de la vérification de l'email");
    },
  });

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Récupérer le token de l'URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        if (!token) {
          setStatus("error");
          setMessage("Token de vérification manquant");
          return;
        }

        // Appeler la mutation tRPC pour vérifier l'email
        await verifyEmailMutation.mutateAsync({ token });
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.message || "Erreur lors de la vérification de l'email");
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Vérification d'email</CardTitle>
          <CardDescription>
            {status === "loading" && "Vérification en cours..."}
            {status === "success" && "Email vérifié avec succès !"}
            {status === "error" && "Erreur de vérification"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          {status === "loading" && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {status === "success" && (
            <div className="text-green-600">
              <p className="text-lg font-semibold">✓ {message}</p>
              <p className="text-sm text-gray-600 mt-2">
                Redirection vers la connexion dans 3 secondes...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-red-600">
              <p className="text-lg font-semibold">✗ {message}</p>
              <Button
                onClick={() => navigate("/auth/choice")}
                className="mt-4 w-full"
              >
                Retour
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
