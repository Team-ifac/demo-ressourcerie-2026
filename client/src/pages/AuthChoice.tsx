import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getQueryParam(name: string): string | null {
  try {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get(name);
    return v && v.trim().length > 0 ? v : null;
  } catch {
    return null;
  }
}

function safeNext(next: string | null): string | null {
  if (!next) return null;
  // On accepte uniquement des chemins internes
  if (!next.startsWith("/")) return null;
  // Evite une boucle vers l'auth
  if (next.startsWith("/auth")) return null;
  return next;
}

export function AuthChoice() {
  const [, navigate] = useLocation();

  const next = safeNext(getQueryParam("next"));
  const nextQs = next ? `?next=${encodeURIComponent(next)}` : "";

  useEffect(() => {
    // On mémorise le "next" pour le récupérer après login/signup
    if (next) localStorage.setItem("auth_next", next);
  }, [next]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bienvenue</CardTitle>
          <CardDescription>
            Connectez-vous ou créez un compte pour accéder à la Ressourcerie
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button className="w-full" onClick={() => navigate(`/auth/login${nextQs}`)}>
            Se connecter
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-500">OU</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <Button variant="outline" className="w-full" onClick={() => navigate(`/auth/signup${nextQs}`)}>
            Créer un compte
          </Button>

          <div className="mt-2 rounded-lg bg-muted/40 p-4">
            <p className="text-sm font-medium">Nouveau sur la plateforme ?</p>
            <p className="text-sm text-muted-foreground mt-1">
              Créez un compte en quelques minutes pour accéder à toutes les ressources adaptées à votre profil.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
