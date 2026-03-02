import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, Play, ShieldCheck, Terminal, AlertTriangle } from "lucide-react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";

type RunMode = "audit" | "dry-run" | "import";

export default function AdminImportsZip() {
  const { user, loading } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<RunMode>("audit");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; output?: string; error?: string; details?: string } | null>(null);

  const canRun = useMemo(() => Boolean(file) && !isRunning, [file, isRunning]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return <Redirect to="/" />;
  }

  const run = async (runMode: RunMode) => {
    if (!file) {
      setResult({ ok: false, error: "Aucun fichier ZIP sélectionné." });
      return;
    }

    setIsRunning(true);
    setResult(null);

    try {
      const buf = await file.arrayBuffer();

      const qs =
        runMode === "audit"
          ? "?audit=1"
          : runMode === "dry-run"
          ? "?dryRun=1"
          : "";

      const resp = await fetch(`/api/admin/import-zip-optionb${qs}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/zip",
        },
        body: buf,
      });

      const data = (await resp.json()) as any;

      if (!resp.ok || !data?.ok) {
        setResult({
          ok: false,
          error: data?.error ?? `Erreur HTTP ${resp.status}`,
          details: data?.details ? String(data.details) : undefined,
        });
        return;
      }

      setResult({ ok: true, output: String(data.output ?? "") });
    } catch (e: any) {
      setResult({ ok: false, error: "Erreur lors de l’import", details: String(e?.message ?? e) });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 py-8">
        <div className="container max-w-6xl space-y-8">
          <Breadcrumb
            items={[
              { label: "Administration", href: "/admin" },
              { label: "Import ZIP (Option B)" },
            ]}
          />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold">Import ZIP (Option B)</h1>
              <p className="text-muted-foreground mt-2">
                Tu uploades un ZIP depuis ton ordinateur. Le serveur dézippe dans un dossier sûr et lance l’import Option B
                (idempotent : NEW / UPDATED / SKIP).
              </p>
            </div>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>1) Sélectionner un ZIP</CardTitle>
              <CardDescription>Choisis ton fichier .zip sur ton ordinateur (Mac).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="file"
                accept=".zip,application/zip"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setResult(null);
                }}
              />

              {file ? (
                <div className="text-sm text-muted-foreground">
                  ZIP sélectionné : <span className="font-medium text-foreground">{file.name}</span> ({Math.round(file.size / 1024 / 1024)}{" "}
                  MB)
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Aucun ZIP sélectionné.</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>2) Lancer</CardTitle>
              <CardDescription>
                Recommandé : commence par <strong>Audit</strong>, puis <strong>Dry-run</strong>, puis <strong>Import réel</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
              <Button
                type="button"
                variant={mode === "audit" ? "default" : "outline"}
                className="gap-2"
                disabled={!canRun}
                onClick={() => {
                  setMode("audit");
                  run("audit");
                }}
              >
                {isRunning && mode === "audit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Audit (disque vs base)
              </Button>

              <Button
                type="button"
                variant={mode === "dry-run" ? "default" : "outline"}
                className="gap-2"
                disabled={!canRun}
                onClick={() => {
                  setMode("dry-run");
                  run("dry-run");
                }}
              >
                {isRunning && mode === "dry-run" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                Dry-run (preview)
              </Button>

              <Button
                type="button"
                variant={mode === "import" ? "destructive" : "outline"}
                className="gap-2"
                disabled={!canRun}
                onClick={() => {
                  setMode("import");
                  run("import");
                }}
              >
                {isRunning && mode === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Import réel
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Résultat
              </CardTitle>
              <CardDescription>Sortie brute du moteur Option B (logs). On mettra ensuite un affichage “propre” NEW/UPDATED/SKIP.</CardDescription>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-sm text-muted-foreground">Lance un audit ou un import pour voir le résultat ici.</div>
              ) : result.ok ? (
                <pre className="whitespace-pre-wrap text-xs bg-muted/40 border rounded-lg p-4 max-h-[420px] overflow-auto">
{result.output || "(aucune sortie)"}
                </pre>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4 mt-0.5" />
                    <div className="text-sm font-medium">{result.error}</div>
                  </div>
                  {result.details ? (
                    <pre className="whitespace-pre-wrap text-xs bg-muted/40 border rounded-lg p-4 max-h-[420px] overflow-auto">
{result.details}
                    </pre>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="space-y-2">
                <p className="font-medium">Rappel</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Audit = vérifie disque vs base (utile avant import).</li>
                  <li>Dry-run = preview sans écrire en base.</li>
                  <li>Import réel = écrit en base (idempotent : met à jour si nécessaire).</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}