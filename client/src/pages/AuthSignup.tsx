import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

const PROFILE_OPTIONS = [
  { value: "animateur", label: "Animateur·rice" },
  { value: "formateur", label: "Formateur·rice" },
  { value: "directeur", label: "Directeur·rice" },
  { value: "stagiaire_bafa", label: "Stagiaire BAFA/BAFD" },
];

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

export function AuthSignup() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const nextFromUrl = useMemo(() => safeNext(getQueryParam("next")), []);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    profileType: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      toast({
        title: "Compte créé avec succès !",
        description: "Un email de confirmation a été envoyé. Veuillez vérifier votre boîte mail.",
      });

      const storedNext = safeNext(localStorage.getItem("auth_next"));
      const next = nextFromUrl || storedNext;

      const qs: string[] = [];
      if (formData.email.trim()) qs.push(`email=${encodeURIComponent(formData.email.trim())}`);
      if (next) qs.push(`next=${encodeURIComponent(next)}`);

      navigate(`/auth/check-email${qs.length ? `?${qs.join("&")}` : ""}`);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Une erreur est survenue lors de la création du compte";
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, profileType: value }));
    if (errors.profileType) setErrors((prev) => ({ ...prev, profileType: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Le prénom est requis";
    if (!formData.lastName.trim()) newErrors.lastName = "Le nom est requis";

    if (!formData.email.trim()) newErrors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Email invalide";

    if (!formData.password) newErrors.password = "Le mot de passe est requis";
    else if (formData.password.length < 8) newErrors.password = "Le mot de passe doit contenir au moins 8 caractères";

    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!formData.profileType) newErrors.profileType = "Veuillez sélectionner un profil";
    if (!formData.acceptTerms) newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (nextFromUrl) localStorage.setItem("auth_next", nextFromUrl);

      await signupMutation.mutateAsync({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        profileType: formData.profileType as "animateur" | "formateur" | "directeur" | "stagiaire_bafa",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const nextQs = (() => {
    const storedNext = safeNext(localStorage.getItem("auth_next"));
    const next = nextFromUrl || storedNext;
    return next ? `?next=${encodeURIComponent(next)}` : "";
  })();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Créer un compte</CardTitle>
          <CardDescription>Remplissez le formulaire pour accéder à la Ressourcerie</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" name="firstName" placeholder="Jean" value={formData.firstName} onChange={handleChange} disabled={isLoading} />
              {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" name="lastName" placeholder="Dupont" value={formData.lastName} onChange={handleChange} disabled={isLoading} />
              {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="jean@example.com" value={formData.email} onChange={handleChange} disabled={isLoading} />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profileType">Qui êtes-vous ? *</Label>
              <Select value={formData.profileType} onValueChange={handleSelectChange}>
                <SelectTrigger id="profileType" disabled={isLoading}>
                  <SelectValue placeholder="Sélectionnez votre profil" />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.profileType && <p className="text-sm text-red-500">{errors.profileType}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe *</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" value={formData.password} onChange={handleChange} disabled={isLoading} />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe *</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))}
                disabled={isLoading}
              />
              <Label htmlFor="acceptTerms" className="text-sm font-normal cursor-pointer">
                J'accepte les{" "}
                <a href="/conditions" className="text-blue-600 hover:underline">
                  conditions d'utilisation
                </a>
                *
              </Label>
            </div>
            {errors.acceptTerms && <p className="text-sm text-red-500">{errors.acceptTerms}</p>}

            <Button type="submit" className="w-full" disabled={isLoading || signupMutation.isPending}>
              {isLoading || signupMutation.isPending ? "Création en cours..." : "Créer mon compte"}
            </Button>

            <div className="text-center text-sm">
              Vous avez déjà un compte ?{" "}
              <button
                type="button"
                onClick={() => navigate(`/auth/login${nextQs}`)}
                className="text-blue-600 hover:underline"
                disabled={isLoading}
              >
                Se connecter
              </button>
            </div>

            <div className="text-center text-sm">
              <button
                type="button"
                onClick={() => navigate(`/auth/choice${nextQs}`)}
                className="text-gray-600 hover:underline"
                disabled={isLoading}
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
