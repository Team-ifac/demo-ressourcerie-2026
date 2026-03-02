/**
 * PILIER 1 — Normalisation imported_thumbs (PRO)
 *
 * Objectif :
 * - Renommer (si besoin) les PNG existants dans client/public/imported_thumbs
 *   pour qu'ils matchent la règle canonique deriveImportedThumbnailUrl().
 *
 * Usage (Terminal TRAVAIL) :
 *   pnpm -s tsx -r dotenv/config server/_scripts/normalize_imported_thumbs.ts --dry-run
 *   pnpm -s tsx -r dotenv/config server/_scripts/normalize_imported_thumbs.ts
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config();

const PROJECT_ROOT = process.cwd();
const THUMBS_ROOT = path.join(PROJECT_ROOT, "client", "public", "imported_thumbs");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function normalizeFileName(input: string): string {
  const base = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  const truncated = base.slice(0, 120);
  return truncated || "fichier";
}

function withPngExtension(filename: string): string {
  const lower = (filename ?? "").toLowerCase();
  if (lower.endsWith(".png")) return filename;
  if (lower.endsWith(".pdf")) return filename.slice(0, -4) + ".png";
  return filename + ".png";
}

function isIgnoredFsPath(absPath: string): boolean {
  const base = path.basename(absPath);
  if (!absPath) return true;
  if (absPath.includes(`${path.sep}__MACOSX${path.sep}`)) return true;
  if (base.startsWith("._")) return true;
  if (base === ".DS_Store") return true;
  return false;
}

function walkFiles(dir: string): string[] {
  const results: string[] = [];
  const stack: string[] = [dir];

  while (stack.length) {
    const cur = stack.pop()!;
    const entries = fs.readdirSync(cur, { withFileTypes: true });

    for (const ent of entries) {
      const abs = path.join(cur, ent.name);

      if (ent.isDirectory()) {
        if (ent.name === "__MACOSX") continue;
        stack.push(abs);
        continue;
      }

      if (ent.isFile()) {
        if (isIgnoredFsPath(abs)) continue;
        if (!ent.name.toLowerCase().endsWith(".png")) continue;
        results.push(abs);
      }
    }
  }

  results.sort((a, b) => a.localeCompare(b));
  return results;
}

function uniqueTargetPath(targetAbs: string): string {
  if (!fs.existsSync(targetAbs)) return targetAbs;

  const dir = path.dirname(targetAbs);
  const ext = path.extname(targetAbs);
  const base = path.basename(targetAbs, ext);

  // on incrémente (rare, mais safe)
  for (let i = 2; i < 9999; i++) {
    const candidate = path.join(dir, `${base}-${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  return targetAbs;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");

  console.log("=== Normalize imported_thumbs (PRO) ===");
  console.log("THUMBS_ROOT:", THUMBS_ROOT);
  console.log("MODE:", isDryRun ? "DRY_RUN" : "WRITE");

  if (!fs.existsSync(THUMBS_ROOT)) {
    console.warn("WARN: dossier imported_thumbs introuvable, création...");
    ensureDir(THUMBS_ROOT);
  }

  const files = walkFiles(THUMBS_ROOT);
  console.log("PNG détectés:", files.length);

  let renamed = 0;
  let skipped = 0;

  const report: Array<{
    from: string;
    to: string;
    action: "RENAME" | "SKIP";
  }> = [];

  for (const abs of files) {
    const dir = path.dirname(abs);
    const filename = path.basename(abs);

    const normalized = withPngExtension(normalizeFileName(filename));
    const targetAbs = path.join(dir, normalized);

    if (abs === targetAbs) {
      skipped++;
      report.push({ from: abs, to: targetAbs, action: "SKIP" });
      continue;
    }

    const finalTarget = uniqueTargetPath(targetAbs);

    if (isDryRun) {
      renamed++;
      console.log(`🧪 [RENAME] ${filename} -> ${path.basename(finalTarget)}`);
      report.push({ from: abs, to: finalTarget, action: "RENAME" });
      continue;
    }

    fs.renameSync(abs, finalTarget);
    renamed++;
    console.log(`✅ [RENAME] ${filename} -> ${path.basename(finalTarget)}`);
    report.push({ from: abs, to: finalTarget, action: "RENAME" });
  }

  console.log("=== SUMMARY ===");
  console.log("Renommés:", renamed);
  console.log("Skippés:", skipped);

  // export report
  try {
    const outDir = path.join(PROJECT_ROOT, "import_tmp");
    ensureDir(outDir);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.join(outDir, `normalize_imported_thumbs_${stamp}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ thumbsRoot: THUMBS_ROOT, renamed, skipped, report }, null, 2), "utf-8");
    console.log("REPORT_WRITTEN:", outPath);
  } catch (e: any) {
    console.warn("REPORT_WRITE_FAILED:", e?.message ?? e);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
