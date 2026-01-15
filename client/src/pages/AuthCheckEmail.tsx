import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";

const useToast = () => {
  return {
    toast: (props: any) => {
      if (props.variant === "destructive") {
        console.error(props.title, props.description);
      } else {
        console.log(props.title, props.description);
      }
    },
  };
};

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
  if (!next.startsWith("/")) return null;
  if (next.startsWith("/auth")) return null;
  return next;
}

export function AuthCheckEmail() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const nextFromUrl = useMemo(() => safeNext(getQueryParam("next")), []);
  const emailFromUrl = useMemo(() => getQueryParam("email"), []);

  const [email, setEmail] = useState(emailFromUrl ?? "");
  const [showResendForm, setShowResendForm] = useState(!emailFromUrl);

  const resendMutation = trpc.auth.resendVerificationEmail.useMutation({
    onSuccess: () => {
      toast({
        title: "Email envoyé",
        description: "Si un compte existe avec cet email, un lien de vérification a été envoyé.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const nextQs = (() => {
    const storedNext = safeNext(localStorage.getItem("auth_next"));
    const next = nextFromUrl || storedNext;
    return next ? `next=${encodeURIComponent(next)}` : "";
  })();

  const goToLogin = () => {
    const qs: string[] = [];
    const usedEmail = (emailFromUrl || email || "").trim();
    if (usedEmail) qs.push(`email=${encodeURIComponent(usedEmail)}`);
    if (nextQs) qs.push(nextQs);
    navigate(`/auth/login${qs.length ? `?${qs.join("&")}` : ""}`);
  };

  const handleResendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const usedEmail = (emailFromUrl || email).trim();

    if (!usedEmail) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer votre email",
        variant: "destructive",
      });
      return;
    }
    await resendMutation.mutateAsync({ email: usedEmail });
  };

  const shownEmail = (emailFromUrl || email).trim();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Vérifiez votre email</CardTitle>
          <CardDescription>
            Un lien de confirmation a été envoyé {shownEmail ? <>à <strong>{shownEmail}</strong></> : <>à votre adresse email</>}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Étapes :</strong>
              </p>
              <ol className="text-sm text-gray-700 list-decimal list-inside mt-2 space-y-1">
                <li>Ouvrez votre boîte mail</li>
                <li>Cherchez l'email de Ressourcerie IFAC (regardez aussi les spams)</li>
                <li>Cliquez sur le lien de vérification</li>
                <li>Revenez ici et connectez-vous</li>
              </ol>
            </div>

            <Button className="w-full" onClick={goToLogin}>
              J'ai vérifié mon email → Se connecter
            </Button>

            <div className="space-y-3">
              <p className="text-sm text-gray-600 text-center">Vous n'avez pas reçu l'email ?</p>

              {!showResendForm ? (
                <Button type="button" variant="outline" className="w-full" onClick={() => setShowResendForm(true)}>
                  Renvoyer l'email de vérification
                </Button>
              ) : (
                <form onSubmit={handleResendSubmit} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Votre email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="vous@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={resendMutation.isPending}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={resendMutation.isPending}>
                    {resendMutation.isPending ? "Envoi en cours..." : "Renvoyer"}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowResendForm(false)}
                    disabled={resendMutation.isPending}
                  >
                    Annuler
                  </Button>
                </form>
              )}
            </div>
          </div>

          <div className="text-center text-sm">
            <button onClick={goToLogin} className="text-blue-600 hover:underline">
              Retour à la connexion
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
