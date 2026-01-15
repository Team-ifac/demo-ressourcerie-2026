import { useState } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function AuthSetPassword() {
  const [, params] = useRoute("/auth/set-password/:token");
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = params?.token;
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validation
    if (!password || !confirmPassword) {
      setError("Tous les champs sont obligatoires");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Token manquant");
      setLoading(false);
      return;
    }

    try {
      // Appeler la procédure tRPC pour réinitialiser le mot de passe
      await resetPasswordMutation.mutateAsync({
        token,
        newPassword: password,
      });

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");

      // Rediriger vers la page de connexion après 3 secondes
      setTimeout(() => {
        navigate("/auth/login");
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border-green-200 bg-green-50/50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <CardTitle>Mot de passe défini avec succès !</CardTitle>
            <CardDescription>
              Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Redirection vers la page de connexion...
            </p>
            <Link href="/auth/login">
              <Button variant="outline">Aller à la connexion</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Définir votre mot de passe</CardTitle>
          <CardDescription>
            Bienvenue ! Créez votre mot de passe pour accéder à la Ressourcerie IFAC.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="Au moins 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirmez votre mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Définition du mot de passe...
                </>
              ) : (
                "Définir mon mot de passe"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Vous avez déjà un compte ?</p>
            <Link href="/auth/login">
              <Button variant="link" className="p-0">
                Se connecter
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
