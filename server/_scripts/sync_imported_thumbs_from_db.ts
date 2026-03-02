/**
 * PILIER 1 — Sync imported_thumbs depuis la DB (PRO)
 *
 * Objectif :
 * - Garantir que les PNG dans client/public/imported_thumbs matchent le canon
 *   deriveImportedThumbnailUrl(resources.fileUrl)
 *
 * Stratégie :
 * - On lit en DB toutes les ressources qui ont un fileUrl commençant par "/imported/"
 * - On calcule le thumbnailUrl canonique via deriveImportedThumbnailUrl(fileUrl)
 * - On cherche une PNG existante "proche" dans imported_thumbs (même dossier) et on la renomme
 * - Mode dry-run possible
 *
 * Usage (Terminal TRAVAIL) :
 *   pnpm -s tsx -r dotenv/config server/_scripts/sync_imported_thumbs_from_db.ts --dry-run --limit 50
 *   pnpm -s tsx -r dotenv/config server/_scripts/sync_imported_thumbs_from_db.ts --limit 500
 */

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
dotenv.config();

import * as db from "../db";

const PROJECT_ROOT = process.cwd();
const PUBLIC_ROOT = path.join(PROJECT_ROOT, "client", "public");
const THUMBS_ROOT = path.join(PUBLIC_ROOT, "imported_thumbs");

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function listPngInDir(dirAbs: string): string[] {
  if (!fs.existsSync(dirAbs)) return [];
  return fs
    .readdirSync(dirAbs)
    .filter((f) => f.toLowerCase().endsWith(".png") && !f.startsWith("._") && f !== ".DS_Store")
    .map((f) => path.join(dirAbs, f));
}

function uniqueTargetPath(targetAbs: string): string {
  if (!fs.existsSync(targetAbs)) return targetAbs;
  const dir = path.dirname(targetAbs);
  const ext = path.extname(targetAbs);
  const base = path.basename(targetAbs, ext);
  for (let i = 2; i < 9999; i++) {
    const candidate = path.join(dir, `${base}-${i}${ext}`);
    if (!fs.existsSync(candidate)) return candidate;
  }
  return targetAbs;
}

async function getImportedResources(limit: number) {
  const dbInstance = await (db as any).getDb?.();
  if (!dbInstance) throw new Error("DB not available");

  const schema = await import("../../drizzle/schema").catch(() => import("../drizzle/schema" as any));
  const { like } = await import("drizzle-orm");

  const resourcesTable = (schema as any).resources;
  const rows = await dbInstance
    .select({
      id: resourcesTable.id,
      fileUrl: resourcesTable.fileUrl,
      thumbnailUrl: resourcesTable.thumbnailUrl,
    })
    .from(resourcesTable)
    .where(like(resourcesTable.fileUrl, "/imported/%"))
    .limit(limit);

  return rows as Array<{ id: number; fileUrl: string; thumbnailUrl: string | null }>;
}

function escapeRegExp(s: string) {
  return (s ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Normalise un nom de png en "clé" alphanumérique (robuste aux accents/espaces/tirets) */
function toAlnumKey(filename: string) {
  return (filename ?? "")
    .toLowerCase()
    .replace(/\.png$/i, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Distance d'édition avec limite (stop early).
 * Retourne un nombre > limit si on dépasse la limite.
 */
function editDistanceLimit(a: string, b: string, limit: number) {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > limit) return limit + 1;

  const prev = new Array(lb + 1);
  const cur = new Array(lb + 1);

  for (let j = 0; j <= lb; j++) prev[j] = j;

  for (let i = 1; i <= la; i++) {
    cur[0] = i;
    let rowMin = cur[0];

    const ai = a.charCodeAt(i - 1);

    for (let j = 1; j <= lb; j++) {
      const cost = ai === b.charCodeAt(j - 1) ? 0 : 1;
      const v = Math.min(
        prev[j] + 1, // delete
        cur[j - 1] + 1, // insert
        prev[j - 1] + cost // subst
      );
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }

    if (rowMin > limit) return limit + 1;

    for (let j = 0; j <= lb; j++) prev[j] = cur[j];
  }

  return prev[lb];
}

/**
 * Choisit le meilleur match "fuzzy" dans une liste de PNG, à partir du filename attendu.
 * - retourne null si aucun match ou si ambigu (2 meilleurs ex-aequo)
 */
function pickBestFuzzyCandidate(expectedBase: string, pngAbsList: string[]) {
  const expectedKey = toAlnumKey(expectedBase);
  if (!expectedKey) return null;

  const scored: Array<{ p: string; d: number }> = [];
  for (const p of pngAbsList) {
    const base = path.basename(p);
    const key = toAlnumKey(base);
    if (!key) continue;

    // limite = 3 (tolère petites corruptions "a-c" vs "a")
    const d = editDistanceLimit(expectedKey, key, 3);
    if (d <= 3) scored.push({ p, d });
  }

  if (scored.length === 0) return null;
  scored.sort((a, b) => a.d - b.d || a.p.localeCompare(b.p));

  // ambigu si 2 meilleurs à même distance
  if (scored.length >= 2 && scored[0].d === scored[1].d) return null;

  return scored[0].p;
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const limitRaw = args.includes("--limit") ? args[args.indexOf("--limit") + 1] : null;
  const limit = limitRaw ? Number(limitRaw) : 200;

  console.log("=== Sync imported_thumbs from DB (PRO) ===");
  console.log("THUMBS_ROOT:", THUMBS_ROOT);
  console.log("MODE:", isDryRun ? "DRY_RUN" : "WRITE");
  console.log("LIMIT:", limit);

  ensureDir(THUMBS_ROOT);

  const rows = await getImportedResources(limit);
  console.log("Imported resources fetched:", rows.length);

  let renamed = 0;
  let missing = 0;
  let skipped = 0;

  const report: Array<
    | { action: "RENAME"; from: string; to: string; resourceId: number }
    | { action: "MISSING"; expected: string; resourceId: number }
    | { action: "SKIP"; reason: string; expected: string; resourceId: number }
  > = [];

  for (const r of rows) {
    const expectedUrl = (db as any).deriveImportedThumbnailUrl?.(r.fileUrl) ?? null;
    if (!expectedUrl) {
      skipped++;
      report.push({ action: "SKIP", reason: "NO_EXPECTED_URL", expected: String(expectedUrl), resourceId: r.id });
      continue;
    }

const expectedFsRel = decodeURIComponent(expectedUrl.replace(/^\//, ""));

// chemin "canon" (non slugifié)
const expectedAbs = path.join(PUBLIC_ROOT, expectedFsRel);

// fallback "slug-path" :
// IMPORTANT : on NE slugifie PAS "imported_thumbs/<profile>/<accessLevel>/"
// on slugifie uniquement les segments "catégories" après ces 3 premiers segments.
const segs = expectedFsRel.split(path.sep).filter(Boolean);
const filename = segs[segs.length - 1] ?? "";
const dirSegsAll = segs.slice(0, -1);

const slugify = (s: string) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim() || "autre";

// attendu : ["imported_thumbs", "<profile>", "<accessLevel>", ...catégories]
const rootSegs = dirSegsAll.slice(0, 3);
const categorySegs = dirSegsAll.slice(3);

const fallbackDir = path.join(PUBLIC_ROOT, ...rootSegs, ...categorySegs.map(slugify));
const fallbackAbs = path.join(fallbackDir, filename);

    const expectedDir = path.dirname(expectedAbs);

    ensureDir(expectedDir);

    // déjà présent => ok
    if (fs.existsSync(expectedAbs)) {
      skipped++;
      report.push({ action: "SKIP", reason: "ALREADY_OK", expected: expectedAbs, resourceId: r.id });
      continue;
    }

    // 0) si le fichier canon existe déjà au bon endroit => SKIP
    if (fs.existsSync(expectedAbs)) {
      skipped++;
      report.push({ action: "SKIP", reason: "ALREADY_OK", expected: expectedAbs, resourceId: r.id });
      continue;
    }

    const expectedBase = path.basename(expectedAbs);
    const expectedStem = expectedBase.replace(/\.png$/i, "");
    const expectedDirCanon = path.dirname(expectedAbs);

    // 1) canon : match exact dans le dossier attendu (non-slug)
    let candidates = listPngInDir(expectedDirCanon).filter((p) => path.basename(p) === expectedBase);

    // 2) fallback "slug-path" : on cherche dans le dossier slugifié
    if (candidates.length === 0) {
      const slugDir = path.dirname(fallbackAbs);
      if (fs.existsSync(slugDir)) {
        const inSlugDir = listPngInDir(slugDir);

        // 2a) match exact filename
        candidates = inSlugDir.filter((p) => path.basename(p) === expectedBase);

        // 2b) suffix -2/-3...
        if (candidates.length === 0) {
          const re = new RegExp(`^${escapeRegExp(expectedStem)}-(\\d+)\\.png$`, "i");
          const suff = inSlugDir.filter((p) => re.test(path.basename(p)));
          if (suff.length === 1) candidates = suff;
          else if (suff.length > 1) candidates = suff;
        }

        // 2c) fuzzy (gère tes cas "a-suspendre" vs "a-c-suspendre", accents cassés, etc.)
        if (candidates.length === 0) {
          const best = pickBestFuzzyCandidate(expectedBase, inSlugDir);
          if (best) candidates = [best];
        }
      }
    }

    // 3) dernier fallback : recherche globale (exact / suffix / fuzzy)
    if (candidates.length === 0) {
      const expectedBaseLower = expectedBase.toLowerCase();
      const reSuff = new RegExp(`^${escapeRegExp(expectedStem)}-(\\d+)\\.png$`, "i");

      const globalFiles: string[] = [];
      const globalMatches: string[] = [];
      const globalSuff: string[] = [];

      const stack: string[] = [THUMBS_ROOT];
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
          if (!ent.isFile()) continue;

          const name = ent.name;
          if (!name.toLowerCase().endsWith(".png")) continue;

          globalFiles.push(abs);

          if (name.toLowerCase() === expectedBaseLower) globalMatches.push(abs);
          else if (reSuff.test(name)) globalSuff.push(abs);
        }
      }

      if (globalMatches.length === 1) candidates = globalMatches;
      else if (globalMatches.length > 1) candidates = globalMatches;
      else if (globalSuff.length === 1) candidates = globalSuff;
      else if (globalSuff.length > 1) candidates = globalSuff;
      else {
        const best = pickBestFuzzyCandidate(expectedBase, globalFiles);
        if (best) candidates = [best];
      }
    }

    if (candidates.length === 0) {
      missing++;
      report.push({ action: "MISSING", expected: expectedAbs, resourceId: r.id });
      continue;
    }

    // sécurité : s'il y en a plusieurs, on ne prend pas de risque
    if (candidates.length !== 1) {
      skipped++;
      report.push({
        action: "SKIP",
        reason: `AMBIGUOUS_${candidates.length}_CANDIDATES`,
        expected: expectedAbs,
        resourceId: r.id,
      });
      continue;
    }

    const from = candidates[0]!;
    const to = uniqueTargetPath(expectedAbs);



    if (isDryRun) {
      renamed++;
      console.log(`🧪 [RENAME] #${r.id} ${path.basename(from)} -> ${path.basename(to)}`);
      report.push({ action: "RENAME", from, to, resourceId: r.id });
      continue;
    }

    fs.renameSync(from, to);
    renamed++;
    console.log(`✅ [RENAME] #${r.id} ${path.basename(from)} -> ${path.basename(to)}`);
    report.push({ action: "RENAME", from, to, resourceId: r.id });
  }

  console.log("=== SUMMARY ===");
  console.log("Renommés:", renamed);
  console.log("Missing:", missing);
  console.log("Skippés:", skipped);

  try {
    const outDir = path.join(PROJECT_ROOT, "import_tmp");
    ensureDir(outDir);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.join(outDir, `sync_imported_thumbs_from_db_${stamp}.json`);
    fs.writeFileSync(outPath, JSON.stringify({ limit, renamed, missing, skipped, report }, null, 2), "utf-8");
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
