import { useEffect, useMemo, useState } from "react";
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

export function AuthLogin() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const nextFromUrl = useMemo(() => safeNext(getQueryParam("next")), []);
  const emailFromUrl = useMemo(() => getQueryParam("email"), []);

  const [formData, setFormData] = useState({
    email: emailFromUrl ?? "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // UX: message spécial "email non vérifié"
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const resendMutation = trpc.auth.resendVerificationEmail.useMutation();

  useEffect(() => {
    // Si next est passé, on le garde aussi en localStorage
    if (nextFromUrl) localStorage.setItem("auth_next", nextFromUrl);
  }, [nextFromUrl]);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      setNeedsEmailVerification(false);

      const storedNext = safeNext(localStorage.getItem("auth_next"));
      const next = nextFromUrl || storedNext;

      toast({
        title: "Connexion réussie !",
        description: "Vous êtes maintenant connecté.",
      });

      // On consomme le next
      localStorage.removeItem("auth_next");

      navigate(next || "/");
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Email ou mot de passe incorrect";

      // cas : email pas vérifié
      if (String(errorMessage).toLowerCase().includes("email not verified")) {
        setNeedsEmailVerification(true);
        toast({
          title: "Email non vérifié",
          description: "Veuillez confirmer votre email pour pouvoir vous connecter.",
          variant: "destructive",
        });
        return;
      }

      setNeedsEmailVerification(false);
      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // dès que l'utilisateur retape, on nettoie l'état UX
    if (needsEmailVerification) setNeedsEmailVerification(false);
    if (resendStatus !== "idle") setResendStatus("idle");

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email invalide";

    if (!formData.password) newErrors.password = "Le mot de passe est requis";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await loginMutation.mutateAsync({ email: formData.email, password: formData.password });
    } catch {
      // géré par onError
    }
  };

  const handleResend = async () => {
    if (!formData.email.trim()) {
      setErrors((prev) => ({ ...prev, email: "Indiquez votre email pour renvoyer le lien." }));
      return;
    }

    setResendStatus("sending");
    try {
      await resendMutation.mutateAsync({ email: formData.email });
      setResendStatus("sent");
      toast({
        title: "Email renvoyé",
        description: "Si un compte existe avec cet email, un nouveau lien de confirmation a été envoyé.",
      });
    } catch (e: any) {
      setResendStatus("error");
      toast({
        title: "Impossible de renvoyer l'email",
        description: e?.message || "Veuillez réessayer dans quelques instants.",
        variant: "destructive",
      });
    }
  };

  const isBusy = loginMutation.isPending || resendMutation.isPending;

  const nextQs = (() => {
    const storedNext = safeNext(localStorage.getItem("auth_next"));
    const next = nextFromUrl || storedNext;
    return next ? `?next=${encodeURIComponent(next)}` : "";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Se connecter</CardTitle>
          <CardDescription>Entrez vos identifiants pour accéder à la Ressourcerie</CardDescription>
        </CardHeader>

        <CardContent>
          {/* Encart UX si email non vérifié */}
          {needsEmailVerification && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">Votre email n’est pas encore vérifié.</p>
              <p className="text-amber-900/80 mt-1">
                Vérifiez votre boîte mail (et vos spams). Vous pouvez aussi renvoyer l’email de confirmation.
              </p>

              <div className="mt-3 flex gap-2">
                <Button type="button" variant="outline" onClick={handleResend} disabled={isBusy}>
                  {resendStatus === "sending"
                    ? "Envoi..."
                    : resendStatus === "sent"
                    ? "Email renvoyé"
                    : "Renvoyer l’email"}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    navigate(
                      `/auth/check-email?email=${encodeURIComponent(formData.email || "")}${
                        nextQs ? `&${nextQs.slice(1)}` : ""
                      }`
                    )
                  }
                  disabled={isBusy}
                >
                  J’ai reçu un email
                </Button>
              </div>

              {resendStatus === "error" && (
                <p className="mt-2 text-xs text-amber-900/80">
                  Problème d’envoi. Réessayez ou vérifiez l’adresse email.
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jean@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isBusy}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Mot de passe */}
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isBusy}
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => navigate("/auth/forgot-password")}
                  className="text-sm text-blue-600 hover:underline"
                  disabled={isBusy}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isBusy}>
              {loginMutation.isPending ? "Connexion en cours..." : "Se connecter"}
            </Button>

            <div className="text-center text-sm">
              Pas encore de compte ?{" "}
              <button
                type="button"
                onClick={() => navigate(`/auth/signup${nextQs}`)}
                className="text-blue-600 hover:underline"
                disabled={isBusy}
              >
                Créer un compte
              </button>
            </div>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate(`/auth/choice${nextQs}`)}
                className="text-gray-600 hover:underline"
                disabled={isBusy}
              >
                ← Retour
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
