import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle, AlertCircle, Loader } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setMessage("Veuillez entrer une adresse email valide");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");

    try {
      // Simuler l'appel API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setStatus("success");
      setMessage("Merci ! Vous recevrez notre newsletter chaque semaine.");
      setEmail("");

      // Réinitialiser après 5 secondes
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    } catch (error) {
      setStatus("error");
      setMessage("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          Restez informé
        </CardTitle>
        <CardDescription>
          Recevez chaque semaine les meilleures ressources pédagogiques
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="bg-white"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="shrink-0"
            >
              {isSubmitting ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                "S'abonner"
              )}
            </Button>
          </div>

          {status === "success" && (
            <div className="flex gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{message}</p>
            </div>
          )}

          {status === "error" && (
            <div className="flex gap-2 text-sm text-red-700 bg-red-50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{message}</p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Nous respectons votre vie privée. Désinscription possible à tout moment.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
