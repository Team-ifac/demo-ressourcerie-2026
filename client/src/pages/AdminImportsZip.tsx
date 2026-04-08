import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Upload,
  Play,
  ShieldCheck,
  Terminal,
  AlertTriangle,
  FileSearch,
  History,
} from "lucide-react";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";

type RunMode = "audit" | "dry-run" | "import";

type AuditResult = {
  mode: "AUDIT";
  extractRoot: string;
  ressourcesRoot: string;
  detectedFiles: number;
  detectedPdfs: number;
  detectedFilesByFamily?: {
    pdf: number;
    presentation: number;
    spreadsheet: number;
    document: number;
    archive: number;
    audio: number;
    video: number;
    image: number;
    other: number;
  };
  inDb: number;
  wouldImport: number;
  wouldUpdate: number;
  detailsShown: number;
  detailsTotal: number;
  details: string[];
};

type ImportHistoryItem = {
  id: number;
  userId: number;
  actionType: "AUDIT" | "DRY_RUN" | "WRITE";
  zipFileName: string | null;
  extractRoot: string | null;
  detectedPdfs: number;
  inDb: number;
  wouldImport: number;
  wouldUpdate: number;
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  logPath: string | null;
  rawOutput: string | null;
  createdAt: string;
  userName?: string | null;
  userEmail?: string | null;
};

type ParsedRunSummary = {
  detectedFiles: number | null;
  detectedPdfs: number | null;
  inDb: number | null;
  wouldImport: number | null;
  wouldUpdate: number | null;
  imported: number | null;
  updated: number | null;
  skipped: number | null;
  failed: number | null;
  thumbsWritten: number | null;
  thumbsSkipped: number | null;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);

  return d.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function extractNumber(raw: string, label: string): number | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = raw.match(new RegExp(`${escaped}\\s*:\\s*(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
}

function parseRunSummary(rawOutput: string | undefined): ParsedRunSummary | null {
  const raw = String(rawOutput ?? "").trim();
  if (!raw) return null;

  return {
    detectedFiles: extractNumber(raw, "Fichiers importables détectés"),
    detectedPdfs: extractNumber(raw, "Dont PDF"),
    inDb: extractNumber(raw, "Déjà en base (fileUrl)"),
    wouldImport: extractNumber(raw, "Nouveaux (seraient importés)") ?? extractNumber(raw, "Nouveaux (importés)"),
    wouldUpdate:
      extractNumber(raw, "Modifiés (seraient remplacés)") ??
      extractNumber(raw, "Modifiés (remplacés)"),
    imported: extractNumber(raw, "Importés (nouveaux)"),
    updated: extractNumber(raw, "Mis à jour (fichiers remplacés)"),
    skipped: extractNumber(raw, "Skippés (inchangés)"),
    failed: extractNumber(raw, "Échecs"),
    thumbsWritten: extractNumber(raw, "Thumbs écrits"),
    thumbsSkipped: extractNumber(raw, "Thumbs non écrits"),
  };
}

export default function AdminImportsZip() {
  const { user, loading } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<RunMode>("audit");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    output?: string;
    error?: string;
    details?: string;
    auditResult?: AuditResult | null;
  } | null>(null);

  const [history, setHistory] = useState<ImportHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const canRun = Boolean(file) && !isRunning;

  async function readApiPayload(resp: Response) {
    const rawText = await resp.text();

    if (!rawText) return null;

    try {
      return JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        error: `Réponse non JSON (HTTP ${resp.status})`,
        details: rawText,
      };
    }
  }

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    void loadHistory();
  }, [user]);

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

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const input = encodeURIComponent(JSON.stringify({ limit: 10, offset: 0 }));
      const resp = await fetch(`/api/trpc/admin.imports.list?input=${input}`, {
        credentials: "include",
      });

      const payload = await readApiPayload(resp);

      if (!resp.ok) {
        throw new Error(
          String(
            payload && typeof payload === "object" && "error" in payload
              ? (payload as any).error
              : `Erreur HTTP ${resp.status}`,
          ),
        );
      }

      const rows =
        payload?.result?.data?.json ??
        payload?.result?.data ??
        payload?.json ??
        payload ??
        [];

      setHistory(Array.isArray(rows) ? rows : []);
    } catch (e: any) {
      setHistoryError(String(e?.message ?? e ?? "Erreur de chargement"));
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
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
        credentials: "include",
        headers: {
          "Content-Type": "application/zip",
        },
        body: buf,
      });

      const data = (await readApiPayload(resp)) as any;

      if (!resp.ok || !data?.ok) {
        setResult({
          ok: false,
          error: data?.error ?? `Erreur HTTP ${resp.status}`,
          details: data?.details ? String(data.details) : undefined,
          auditResult: null,
        });
        return;
      }

      setResult({
        ok: true,
        output: String(data.output ?? ""),
        auditResult: data?.auditResult ?? null,
      });

      await loadHistory();
    } catch (e: any) {
      setResult({
        ok: false,
        error: "Erreur lors de l’import",
        details: String(e?.message ?? e),
        auditResult: null,
      });
    } finally {
      setIsRunning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const audit = result?.auditResult ?? null;
  const auditFamilies = audit?.detectedFilesByFamily ?? null;
  const parsedRunSummary = parseRunSummary(result?.output);
  const showStructuredRunSummary = !audit && !!result?.ok && !!parsedRunSummary;
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
                ref={fileInputRef}
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setFile(f);
                  setResult(null);
                }}
              />

              {file ? (
                <div className="text-sm text-muted-foreground">
                  ZIP sélectionné : <span className="font-medium text-foreground">{file.name}</span> ({Math.round(file.size / 1024 / 1024)} MB)
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

          {audit ? (
            <Card className="shadow-elegant border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-4 w-4" />
                  Résumé d’audit
                </CardTitle>
                <CardDescription>Lecture structurée de l’audit avant import.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Fichiers détectés</div>
                    <div className="text-2xl font-bold">{audit.detectedFiles}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">PDF détectés</div>
                    <div className="text-2xl font-bold">{audit.detectedPdfs}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Déjà en base</div>
                    <div className="text-2xl font-bold">{audit.inDb}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Fichiers à mettre à jour</div>
                    <div className="text-2xl font-bold">{audit.wouldUpdate}</div>
                  </div>
                </div>

                {auditFamilies ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Présentations</div>
                      <div className="text-2xl font-bold">{auditFamilies.presentation}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Tableurs</div>
                      <div className="text-2xl font-bold">{auditFamilies.spreadsheet}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Documents texte</div>
                      <div className="text-2xl font-bold">{auditFamilies.document}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Images</div>
                      <div className="text-2xl font-bold">{auditFamilies.image}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Audio</div>
                      <div className="text-2xl font-bold">{auditFamilies.audio}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Vidéos</div>
                      <div className="text-2xl font-bold">{auditFamilies.video}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Archives</div>
                      <div className="text-2xl font-bold">{auditFamilies.archive}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Autres</div>
                      <div className="text-2xl font-bold">{auditFamilies.other}</div>
                    </div>
                  </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Nouveaux à importer</div>
                    <div className="text-2xl font-bold">{audit.wouldImport}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Détails affichés</div>
                    <div className="text-2xl font-bold">
                      {audit.detailsShown} <span className="text-base font-normal text-muted-foreground">/ {audit.detailsTotal}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="text-sm font-medium">Détails affichés</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {audit.detailsShown} sur {audit.detailsTotal}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-sm font-medium">Détails des changements</div>

                  {audit.details.length === 0 && (
                    <div className="text-sm text-muted-foreground">
                      Aucun changement détecté.
                    </div>
                  )}

                  {audit.details.filter((d) => d.includes("[NEW]")).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Nouveaux fichiers</div>
                      <pre className="whitespace-pre-wrap text-xs bg-muted/40 border rounded-lg p-4 max-h-[200px] overflow-auto">
{audit.details.filter((d) => d.includes("[NEW]")).join("\n")}
                      </pre>
                    </div>
                  )}

                  {audit.details.filter((d) => d.includes("[UPDATE]")).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-semibold">Fichiers à mettre à jour</div>
                      <pre className="whitespace-pre-wrap text-xs bg-muted/40 border rounded-lg p-4 max-h-[200px] overflow-auto">
{audit.details.filter((d) => d.includes("[UPDATE]")).join("\n")}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {showStructuredRunSummary ? (
            <Card className="shadow-elegant border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Résumé structuré
                </CardTitle>
                <CardDescription>
                  Lecture simplifiée du résultat {mode === "dry-run" ? "dry-run" : "import réel"}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Fichiers détectés</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.detectedFiles ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">PDF détectés</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.detectedPdfs ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Déjà en base</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.inDb ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Erreurs</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.failed ?? "—"}</div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Nouveaux</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.wouldImport ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Modifiés</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.wouldUpdate ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">Skippés</div>
                    <div className="text-2xl font-bold">{parsedRunSummary.skipped ?? "—"}</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-sm text-muted-foreground">
                      {mode === "import" ? "Mis à jour" : "Importés"}
                    </div>
                    <div className="text-2xl font-bold">
                      {mode === "import"
                        ? (parsedRunSummary.updated ?? "—")
                        : (parsedRunSummary.imported ?? "—")}
                    </div>
                  </div>
                </div>

                {mode === "import" ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Thumbs écrits</div>
                      <div className="text-2xl font-bold">{parsedRunSummary.thumbsWritten ?? "—"}</div>
                    </div>
                    <div className="rounded-lg border p-4">
                      <div className="text-sm text-muted-foreground">Thumbs non écrits</div>
                      <div className="text-2xl font-bold">{parsedRunSummary.thumbsSkipped ?? "—"}</div>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Résultat brut
              </CardTitle>
              <CardDescription>Sortie complète du moteur Option B pour debug et historique.</CardDescription>
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

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Historique des imports
              </CardTitle>
              <CardDescription>
                Journal des actions admin : audit, dry-run et import réel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement de l’historique…
                </div>
              ) : historyError ? (
                <div className="text-sm text-destructive">{historyError}</div>
              ) : history.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Aucun historique disponible pour le moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                        <div className="font-medium">
                          #{item.id} — {item.actionType}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDateTime(item.createdAt)}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Utilisateur</div>
                          <div>{item.userName || item.userEmail || `#${item.userId}`}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">ZIP</div>
                          <div>{item.zipFileName || "—"}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">PDF détectés</div>
                          <div>{item.detectedPdfs}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Erreurs</div>
                          <div>{item.failed}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Déjà en base</div>
                          <div>{item.inDb}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">À importer</div>
                          <div>{item.wouldImport}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">À mettre à jour</div>
                          <div>{item.wouldUpdate}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Skippés</div>
                          <div>{item.skipped}</div>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3 text-sm">
                        <div>
                          <div className="text-muted-foreground">Importés</div>
                          <div>{item.imported}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Mis à jour</div>
                          <div>{item.updated}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Dossier extrait</div>
                          <div className="break-all">{item.extractRoot || "—"}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <Button type="button" variant="outline" onClick={() => void loadHistory()} disabled={historyLoading}>
                  {historyLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Actualiser l’historique
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="py-6">
              <div className="space-y-2">
                <p className="font-medium">Rappel</p>
                <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                  <li>Audit = vérifie disque vs base.</li>
                  <li>Dry-run = preview sans écrire en base.</li>
                  <li>Import réel = écrit en base de manière idempotente.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}