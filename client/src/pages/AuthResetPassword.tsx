import { trpc } from "@/lib/trpc";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

function getTokenFromUrl(): string | null {
  const url = new URL(window.location.href);
  return url.searchParams.get("token");
}

export function AuthResetPassword() {
  const [, navigate] = useLocation();
  const token = useMemo(() => getTokenFromUrl(), []);

  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [done, setDone] = useState(false);

  const resetPassword = trpc.auth.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true);
      setTimeout(() => navigate("/auth/login"), 800);
    },
  });

  const localError =
    !token
      ? "Token manquant dans l’URL."
      : password.length > 0 && password.length < 8
      ? "Le mot de passe doit faire au moins 8 caractères."
      : password2.length > 0 && password !== password2
      ? "Les deux mots de passe ne correspondent pas."
      : null;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localError) return;

    resetPassword.mutate({
      token: token as string,
      newPassword: password,
    });
  };

  return (
    <div style={{ maxWidth: 420, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Réinitialiser le mot de passe</h1>

      {done ? (
        <div style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
          <p style={{ margin: 0, fontWeight: 600 }}>Mot de passe mis à jour.</p>
          <p style={{ margin: "8px 0 0 0", opacity: 0.8 }}>Redirection vers la connexion…</p>
        </div>
      ) : (
        <form onSubmit={onSubmit} style={{ marginTop: 16 }}>
          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Nouveau mot de passe
          </label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              marginBottom: 12,
            }}
            disabled={resetPassword.isPending}
          />

          <label style={{ display: "block", marginBottom: 8, fontWeight: 600 }}>
            Confirmer le mot de passe
          </label>
          <input
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            type="password"
            required
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #ccc",
              marginBottom: 12,
            }}
            disabled={resetPassword.isPending}
          />

          {(localError || resetPassword.error) && (
            <div style={{ marginBottom: 12, color: "crimson" }}>
              {localError ?? "Impossible de réinitialiser. Le lien est peut-être expiré."}
            </div>
          )}

          <button
            type="submit"
            disabled={resetPassword.isPending || !!localError}
            style={{
              width: "100%",
              padding: 10,
              borderRadius: 8,
              border: "1px solid #000",
              background: resetPassword.isPending ? "#eee" : "#fff",
              cursor: resetPassword.isPending ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {resetPassword.isPending ? "Validation..." : "Valider"}
          </button>
        </form>
      )}
    </div>
  );
}
