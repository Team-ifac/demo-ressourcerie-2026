import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import React, { useState } from "react";

export function AuthForgotPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotPassword = trpc.auth.forgotPassword.useMutation({
    onSuccess: () => setSent(true),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate({ email });
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Mot de passe oublié</h1>
      <p style={{ marginBottom: 16, opacity: 0.8 }}>
        Saisis ton email. Si un compte existe, tu recevras un lien de réinitialisation.
      </p>

      {sent ? (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>C’est envoyé (si le compte existe).</p>
          <p style={{ margin: "8px 0 0 0", opacity: 0.8 }}>Vérifie ta boîte mail (et les spams).</p>

          <button
            onClick={() => navigate("/auth/login")}
            style={{
              marginTop: 12,
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #000",
              background: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Retour à la connexion
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="ton@email.fr"
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              marginBottom: 12,
            }}
            disabled={forgotPassword.isPending}
          />

          {forgotPassword.error && (
            <div style={{ marginBottom: 12, color: "crimson" }}>
              Une erreur est survenue. Réessaie dans un instant.
            </div>
          )}

          <button
            type="submit"
            disabled={forgotPassword.isPending}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #000",
              background: forgotPassword.isPending ? "#eee" : "#fff",
              cursor: forgotPassword.isPending ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {forgotPassword.isPending ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      )}
    </div>
  );
}
