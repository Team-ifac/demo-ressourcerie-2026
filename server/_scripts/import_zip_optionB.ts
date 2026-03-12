/**
 * Import Option B (PRO) - IMPORT DEPUIS DOSSIER EXTRAIT
 *
 * Source: import_tmp/_extract_all/ressources/...
 *
 * Objectifs :
 * - fileUrl miroir exact du chemin réellement copié dans client/public/imported
 * - Idempotent :
 *    - Nouveau fileUrl => on crée en DB + copie sur disque
 *    - fileUrl déjà en DB :
 *        - si le fichier a CHANGÉ => on REMPLACE sur disque (sans renommer)
 *        - sinon => on ignore
 * - category (DB) = clé canonique string (eq) : ex "techniques-d-animation/jeux-de-plein-air"
 * - status : publie->approved, brouillon->draft, A CLASSER->pending
 * - accessLevel : public->PUBLIC, connecte->INTERNAL_IFAC, premium->PREMIUM
 * - ✅ PILIER 2 (béton) : génération automatique des thumbnails imported_thumbs au moment de l'import (macOS QuickLook)
 *
 * Usage (Terminal TRAVAIL):
 *   pnpm -s tsx -r dotenv/config server/_scripts/import_zip_optionB.ts --dry-run --extract-root import_tmp/_extract_all_v2
 *   pnpm -s tsx -r dotenv/config server/_scripts/import_zip_optionB.ts --audit --audit-limit 20 --extract-root import_tmp/_extract_all_v2
 *   pnpm -s tsx -r dotenv/config server/_scripts/import_zip_optionB.ts --extract-root import_tmp/_extract_all_v2
 *
 * Option (utile CI/rapidité) :
 *   --no-thumbs   => n'essaie pas de générer les PNG (DB reste OK, mais import pas "100% propre" disque)
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import * as db from "../db";

const PROJECT_ROOT = process.cwd();

function readArgValue(args: string[], name: string): string | null {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  const v = args[idx + 1];
  if (!v || v.startsWith("--")) return null;
  return v;
}

function resolvePathFromProjectRoot(p: string): string {
  return path.isAbsolute(p) ? p : path.join(PROJECT_ROOT, p);
}

// Valeurs par défaut
const DEFAULT_EXTRACT_ROOT = path.join(PROJECT_ROOT, "import_tmp", "_extract_all");

// Lecture CLI
const CLI_ARGS = process.argv.slice(2);
const extractRootArg = readArgValue(CLI_ARGS, "--extract-root");
const ressourcesRootArg = readArgValue(CLI_ARGS, "--ressources-root");

const EXTRACT_ROOT = extractRootArg
  ? resolvePathFromProjectRoot(extractRootArg)
  : DEFAULT_EXTRACT_ROOT;

const RESSOURCES_ROOT = ressourcesRootArg
  ? resolvePathFromProjectRoot(ressourcesRootArg)
  : path.join(EXTRACT_ROOT, "ressources");

const PUBLIC_BASE_DIR = path.join(PROJECT_ROOT, "client", "public", "imported");
const PUBLIC_URL_BASE = "/imported";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
type AccessLevel = "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";
type Status = "draft" | "approved" | "pending";
type Mode = "DRY_RUN" | "AUDIT" | "WRITE";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

const SUPPORTED_IMPORT_EXTENSIONS = new Set([
  ".pdf",
  ".zip",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".mp3",
  ".wav",
  ".m4a",
  ".aac",
  ".ogg",
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".mkv",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
]);

function getFileExtensionLower(filePath: string): string {
  return path.extname(filePath ?? "").toLowerCase();
}

function isPdfFile(filePath: string): boolean {
  return getFileExtensionLower(filePath) === ".pdf";
}

function isOfficePreviewConvertible(filePath: string): boolean {
  const ext = getFileExtensionLower(filePath);

  return [
    ".ppt",
    ".pptx",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".odt",
    ".ods",
    ".odp",
  ].includes(ext);
}
function tryGenerateOfficePreviewPdf(
  sourceFile: string,
  options: { enabled: boolean }
): { previewPdfPath: string | null; written: boolean } {
  if (!options.enabled) return { previewPdfPath: null, written: false };

  if (!isOfficePreviewConvertible(sourceFile)) {
    return { previewPdfPath: null, written: false };
  }

  try {
    const dir = path.dirname(sourceFile);
    const base = path.basename(sourceFile);
    const nameWithoutExt = base.replace(/\.[^/.]+$/, "");
    const previewPdf = path.join(dir, `${nameWithoutExt}.preview.pdf`);

    // LibreOffice headless conversion
    execFileSync("soffice", [
      "--headless",
      "--convert-to",
      "pdf",
      "--outdir",
      dir,
      sourceFile,
    ]);

    const producedPdf = path.join(dir, `${nameWithoutExt}.pdf`);

    if (!fs.existsSync(producedPdf)) {
      console.warn(`⚠️  preview PDF non généré pour: ${sourceFile}`);
      return { previewPdfPath: null, written: false };
    }

    fs.renameSync(producedPdf, previewPdf);

    return { previewPdfPath: previewPdf, written: true };
  } catch (e: any) {
    console.warn(
      `⚠️  conversion office->pdf impossible pour ${sourceFile}: ${
        e?.message ?? e
      }`
    );

    return { previewPdfPath: null, written: false };
  }
}
function isSupportedImportFile(filePath: string): boolean {
  return SUPPORTED_IMPORT_EXTENSIONS.has(getFileExtensionLower(filePath));
}

function isIgnoredFsPath(absPath: string): boolean {
  const base = path.basename(absPath);
  if (!absPath) return true;
  if (absPath.includes(`${path.sep}__MACOSX${path.sep}`)) return true;
  if (base.startsWith("._")) return true;
  if (base === ".DS_Store") return true;
  if (!isSupportedImportFile(absPath)) return true;
  return false;
}

/** Nettoyage léger, sans casser les noms (usage disque) */
function cleanText(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire accents combinés
    .replace(/[<>:"|?*\u0000-\u001F]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
}

/** Segment sûr pour dossier/fichier (sans /) */
function normalizeFileName(input: string): string {
  const base = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // supprime accents
    .toLowerCase()
    .replace(/['’]/g, "") // supprime apostrophes
    .replace(/[^a-z0-9.]+/g, "-") // remplace tout par tirets sauf lettres/chiffres/point
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  // sécurité longueur
  const truncated = base.slice(0, 120);

  return truncated || "fichier";
}

/** Segment sûr pour dossier/fichier (sans /) — compat legacy safeSegment */
function safeSegment(seg: string): string {
  // On garde le remplacement des slashs par sécurité,
  // puis on applique la normalisation pro.
  return normalizeFileName((seg ?? "").replace(/\//g, "_"));
}

/** Slug canonique (usage categoryKey) */
function slugifySegment(input: string): string {
  const s = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ") // apostrophes -> espace
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  return s || "autre";
}

function walkImportableFiles(dir: string): string[] {
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
        results.push(abs);
      }
    }
  }

  results.sort((a, b) => a.localeCompare(b));
  return results;
}

/** "A CLASSER" peut avoir des espaces en tête dans ton extraction */
function isAClasserRoot(part0: string): boolean {
  return (part0 ?? "").trim().toLowerCase().includes("a classer");
}

function detectProfileFromParts(parts: string[]): ProfileType {
  const firstRaw = parts[0] ?? "";
  const first = firstRaw.toLowerCase();

  if (isAClasserRoot(firstRaw)) return "formateur";

  if (first.includes("animateur")) return "animateur";
  if (first.includes("formateur")) return "formateur";
  if (first.includes("directeur")) return "directeur";
  if (first.includes("stagiaire")) return "stagiaire_bafa";

  return "formateur";
}

function detectStatusFromParts(parts: string[]): Status {
  const part0 = parts[0] ?? "";
  if (isAClasserRoot(part0)) return "pending";

  const lower = parts.map((p) => (p ?? "").toLowerCase());

  // Règle PRO (zéro travail manuel) :
  // - par défaut : pending (validation requise)
  // - publie/ : approved
  // - brouillon/ : draft
  if (lower.includes("brouillon")) return "draft";
  if (lower.includes("publie")) return "approved";

  return "pending";
}

function detectAccessLevelFromParts(parts: string[]): AccessLevel {
  const lower = parts.map((p) => (p ?? "").toLowerCase());

  if (lower.includes("premium")) return "PREMIUM";

  // "connecte" = INTERNAL_IFAC (nouveau canon)
  if (
    lower.includes("connecte") ||
    lower.includes("internal_ifac") ||
    parts.includes("INTERNAL_IFAC")
  ) {
    return "INTERNAL_IFAC";
  }

  if (lower.includes("public") || parts.includes("PUBLIC")) return "PUBLIC";
  return "PUBLIC";
}

function buildCategoryPartsForDisk(relParts: string[]): string[] {
  const stopLower = new Set([
    "document",
    "publie",
    "brouillon",
    "public",
    "connecte",
    "premium",
    "internal_ifac",
  ]);
  const stopExact = new Set(["PUBLIC", "INTERNAL_IFAC", "PREMIUM"]);

  const middle = relParts.slice(1, -1);
  const cats = middle.filter((p) => {
    if (stopExact.has(p)) return false;
    if (stopLower.has(p.toLowerCase())) return false;
    return true;
  });

  return cats.map(safeSegment).filter(Boolean);
}

function buildCategoryKey(relParts: string[]): string {
  const stopLower = new Set([
    "document",
    "publie",
    "brouillon",
    "public",
    "connecte",
    "premium",
    "internal_ifac",
  ]);
  const stopExact = new Set(["PUBLIC", "INTERNAL_IFAC", "PREMIUM"]);

  const middle = relParts.slice(1, -1);
  const rawCats = middle.filter((p) => {
    if (stopExact.has(p)) return false;
    if (stopLower.has(p.toLowerCase())) return false;
    return true;
  });

  const slugs = rawCats.map(slugifySegment).filter(Boolean);
  return slugs.join("/") || "autre";
}

function buildTitleFromFilename(filename: string): string {
  const ext = path.extname(filename);
  const raw = filename.slice(0, filename.length - ext.length).trim();
  const cleaned = cleanText(raw);
  return cleaned || "Sans titre";
}

function encodeUrlPathSegments(segs: string[]): string {
  return segs.map((s) => encodeURIComponent(s)).join("/");
}

/** Idempotence DB: existe déjà par fileUrl OU storageKey ? */
async function findExistingResource(
  fileUrl: string,
  storageKey: string
): Promise<{ id: number; fileUrl: string | null } | null> {
  try {
    const db2 = await (db as any).getDb?.();
    if (!db2) return null;

    const schema = await import("../../drizzle/schema").catch(() =>
      import("../drizzle/schema" as any)
    );
    const { eq, or } = await import("drizzle-orm");

    const resourcesTable = (schema as any).resources;
    if (!resourcesTable?.id) return null;

    const rows = await db2
      .select({ id: resourcesTable.id, fileUrl: resourcesTable.fileUrl })
      .from(resourcesTable)
      .where(
        or(eq(resourcesTable.fileUrl, fileUrl as any), eq(resourcesTable.storageKey, storageKey as any))
      )
      .limit(1);

    if (!Array.isArray(rows) || rows.length === 0) return null;

    return {
      id: Number((rows[0] as any).id),
      fileUrl: (rows[0] as any).fileUrl ?? null,
    };
  } catch {
    return null;
  }
}

/** Si une ressource existe déjà (storageKey) mais fileUrl est NULL, on la “répare” */
async function patchExistingResourceFileUrlIfMissing(args: {
  id: number;
  fileUrl: string;
  storageKey: string;
  thumbnailUrl: string | null;
  visibility: "PUBLIC" | "INTERNAL_IFAC";
  accessLevel: "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";
  status: "draft" | "approved" | "pending";
  category: string;
}): Promise<void> {
  try {
    const db2 = await (db as any).getDb?.();
    if (!db2) return;

    const schema = await import("../../drizzle/schema").catch(() =>
      import("../drizzle/schema" as any)
    );
    const { eq } = await import("drizzle-orm");

    const resourcesTable = (schema as any).resources;
    if (!resourcesTable?.id) return;

    await db2
      .update(resourcesTable)
      .set({
        fileUrl: args.fileUrl as any,
        storageKey: args.storageKey as any,
        thumbnailUrl: args.thumbnailUrl as any,
        visibility: args.visibility as any,
        accessLevel: args.accessLevel as any,
        status: args.status as any,
        category: args.category as any,
      } as any)
      .where(eq(resourcesTable.id, args.id as any));
  } catch {
    // non bloquant
  }
}

/** Migration fileUrl : AUTHENTICATED -> INTERNAL_IFAC (anti-doublons historique) */
async function migrateAuthenticatedFileUrlIfNeeded(
  fileUrl: string
): Promise<boolean> {
  // uniquement si le fileUrl cible est INTERNAL_IFAC
  if (!fileUrl.includes("/INTERNAL_IFAC/")) return false;

  const legacyFileUrl = fileUrl.replace("/INTERNAL_IFAC/", "/AUTHENTICATED/");
  if (legacyFileUrl === fileUrl) return false;

  try {
    const db2 = await (db as any).getDb?.();
    if (!db2) return false;

    const schema = await import("../../drizzle/schema").catch(() =>
      import("../drizzle/schema" as any)
    );
    const { eq } = await import("drizzle-orm");

    const resourcesTable = (schema as any).resources;
    if (!resourcesTable?.fileUrl) return false;

    // est-ce qu'une ligne legacy existe ?
    const rows = await db2
      .select({ id: resourcesTable.id })
      .from(resourcesTable)
      .where(eq(resourcesTable.fileUrl, legacyFileUrl))
      .limit(1);

    if (!Array.isArray(rows) || rows.length === 0) return false;

    // met à jour vers le nouveau fileUrl
    await db2
      .update(resourcesTable)
      .set({ fileUrl })
      .where(eq(resourcesTable.fileUrl, legacyFileUrl));

    console.log(
      `🧹 [MIGRATE] fileUrl legacy -> canon : ${legacyFileUrl} => ${fileUrl}`
    );
    return true;
  } catch {
    return false;
  }
}

/** Compare 2 fichiers (simple et fiable) : on compare la taille, et si égal, on compare le contenu */
function filesAreIdentical(a: string, b: string): boolean {
  try {
    if (!fs.existsSync(a) || !fs.existsSync(b)) return false;

    const sa = fs.statSync(a);
    const sb = fs.statSync(b);
    if (sa.size !== sb.size) return false;

    // taille identique => on compare le contenu (empreinte)
    const ha = sha256File(a);
    const hb = sha256File(b);
    return ha === hb;
  } catch {
    return false;
  }
}

function sha256File(p: string): string {
  const h = crypto.createHash("sha256");
  const data = fs.readFileSync(p);
  h.update(data);
  return h.digest("hex");
}

// =====================================================
// PILIER 3 — Taxonomy DB (category_nodes + resource_category_nodes)
// - Upsert idempotent de la chaîne de catégories
// - Link ressource -> leaf node
// =====================================================

function buildCategoryPartsForTaxonomy(relParts: string[]): string[] {
  const stopLower = new Set([
    "document",
    "publie",
    "brouillon",
    "public",
    "connecte",
    "premium",
    "internal_ifac",
  ]);
  const stopExact = new Set(["PUBLIC", "INTERNAL_IFAC", "PREMIUM"]);

  const middle = relParts.slice(1, -1);
  const rawCats = middle.filter((p) => {
    if (stopExact.has(p)) return false;
    if (stopLower.has((p ?? "").toLowerCase())) return false;
    return true;
  });

  // On garde une version "titre" lisible (pas slug), mais nettoyée
  return rawCats.map((c) => cleanText(String(c || ""))).filter(Boolean);
}

async function ensureTaxonomyLink(
  resourceId: number,
  profileType: ProfileType,
  categoryPartsTitle: string[]
): Promise<void> {
  // Pas de catégories -> on met "Autre" pour avoir une leaf stable
  const parts = categoryPartsTitle.length > 0 ? categoryPartsTitle : ["Autre"];

  const db2 = await (db as any).getDb?.();
  if (!db2) return;

  const schema = await import("../../drizzle/schema").catch(() =>
    import("../drizzle/schema" as any)
  );

  const { eq, and, isNull } = await import("drizzle-orm");

  const categoryNodes =
    (schema as any).categoryNodes ?? (schema as any).category_nodes;
  const resourceCategoryNodes =
    (schema as any).resourceCategoryNodes ?? (schema as any).resource_category_nodes;
  const profileTypes =
    (schema as any).profileTypes ?? (schema as any).profile_types;

  if (!categoryNodes || !resourceCategoryNodes || !profileTypes) return;

  const profileRows: Array<{ id: number }> = (await db2
    .select({ id: profileTypes.id })
    .from(profileTypes)
    .where(eq(profileTypes.key, profileType as any))
    .limit(1)) as any;

  const profileTypeId = profileRows?.[0]?.id ? Number(profileRows[0].id) : null;
  if (!profileTypeId) return;

  let parentId: number | null = null;
  let leafId: number | null = null;

  for (const title of parts) {
    const slug = slugifySegment(title);

    const whereClause =
      parentId === null
        ? and(
            eq(categoryNodes.profileTypeId, profileTypeId as any),
            isNull(categoryNodes.parentId),
            eq(categoryNodes.slug, slug)
          )
        : and(
            eq(categoryNodes.profileTypeId, profileTypeId as any),
            eq(categoryNodes.parentId, parentId as any),
            eq(categoryNodes.slug, slug)
          );

    // 1) cherche si le node existe déjà
    const existing: Array<{ id: number }> = (await db2
      .select({ id: categoryNodes.id })
      .from(categoryNodes)
      .where(whereClause)
      .limit(1)) as any;

    if (Array.isArray(existing) && existing.length > 0) {
      parentId = Number(existing[0].id);
      leafId = parentId;
      continue;
    }

    // 2) crée le node
    await db2
      .insert(categoryNodes)
      .values({
        profileTypeId: profileTypeId as any,
        parentId: parentId as any,
        parentIdKey: parentId === null ? "__ROOT__" : String(parentId),
        slug,
        title,
        description: null,
        sortOrder: 0,
        isActive: 1,
      } as any)
      .onDuplicateKeyUpdate({
        set: { slug },
      });

    // 3) relit l'id (robuste MySQL)
    const created: Array<{ id: number }> = (await db2
      .select({ id: categoryNodes.id })
      .from(categoryNodes)
      .where(whereClause)
      .limit(1)) as any;

    if (Array.isArray(created) && created.length > 0) {
      parentId = Number(created[0].id);
      leafId = parentId;
    }
  }

  if (!leafId) return;

  // Link ressource -> leaf (idempotent via PK(resourceId, categoryNodeId))
  try {
    await db2.insert(resourceCategoryNodes).values({
      resourceId,
      categoryNodeId: leafId,
    } as any);
  } catch {
    // ignore duplicates
  }
}

/**
 * Génère un PNG thumbnail à l'emplacement canonique (client/public/imported_thumbs/...)
 * via QuickLook (macOS) :
 * - attendu: deriveImportedThumbnailUrl(fileUrl) => "/imported_thumbs/.../name.png"
 * - on écrit sur disque dans client/public + expectedUrl
 *
 * ⚠️ Si qlmanage n'est pas dispo (CI/Linux), on n'échoue pas l'import : on WARN seulement.
 */
function tryGenerateImportedThumbPng(
  pdfAbs: string,
  fileUrl: string,
  options: { enabled: boolean }
): { expectedUrl: string | null; written: boolean } {
  const expectedUrl =
    (db as any).deriveImportedThumbnailUrl?.(fileUrl) ?? null;

  if (!expectedUrl) return { expectedUrl: null, written: false };
  if (!options.enabled) return { expectedUrl, written: false };

  try {
    // map URL -> disk path
    const decoded = decodeURIComponent(expectedUrl);
    const rel = decoded.replace(/^\/+/, ""); // "imported_thumbs/....png"
    const expectedAbs = path.join(PROJECT_ROOT, "client", "public", rel);

    const expectedDir = path.dirname(expectedAbs);
    ensureDir(expectedDir);

    // tmp output dir
    const tmpOutDir = path.join(PROJECT_ROOT, "import_tmp", "_thumb_tmp");
    ensureDir(tmpOutDir);

    // QuickLook render
    // -t : thumbnail
    // -s : size (px)
    // -o : output dir
    execFileSync("qlmanage", ["-t", "-s", "1000", "-o", tmpOutDir, pdfAbs], {
      stdio: "ignore",
    });

    // qlmanage output naming can vary; handle both common patterns
    const basePdf = path.basename(pdfAbs); // ex "doc.pdf"
    const baseNoExt = basePdf.replace(/\.pdf$/i, "");
    const candidateA = path.join(tmpOutDir, `${basePdf}.png`);
    const candidateB = path.join(tmpOutDir, `${baseNoExt}.png`);

    const produced =
      (fs.existsSync(candidateB) && candidateB) ||
      (fs.existsSync(candidateA) && candidateA) ||
      null;

    if (!produced) {
      console.warn(`⚠️  [THUMB] qlmanage n'a pas produit de PNG pour: ${pdfAbs}`);
      return { expectedUrl, written: false };
    }

    // move/overwrite to canonical path
    fs.copyFileSync(produced, expectedAbs);

    return { expectedUrl, written: true };
  } catch (e: any) {
    // Non bloquant
    console.warn(
      `⚠️  [THUMB] génération impossible (non bloquant) pour ${pdfAbs}: ${
        e?.message ?? e
      }`
    );
    return { expectedUrl, written: false };
  }
}

async function main() {
  const args = process.argv.slice(2);

  const isDryRun = args.includes("--dry-run");
  const isAudit = args.includes("--audit");
  const auditLimitRaw = readArgValue(args, "--audit-limit");
  const auditLimit = auditLimitRaw ? Number(auditLimitRaw) : 20;

  const mode: Mode = isDryRun ? "DRY_RUN" : isAudit ? "AUDIT" : "WRITE";

  const noThumbs = args.includes("--no-thumbs");

  // Nouveaux flags
  const maxRaw = readArgValue(args, "--max");
  const max = maxRaw ? Number(maxRaw) : null;
  const thumbsOnly = args.includes("--thumbs-only");

  // thumbsOnly force la génération même si mode=WRITE et même si tout est "SKIP"
  const thumbsEnabled = (mode === "WRITE" && !noThumbs) || thumbsOnly;

  console.log("=== Import Option B (depuis dossier extrait) ===");
  console.log("EXTRACT_ROOT:", EXTRACT_ROOT);
  console.log("RESSOURCES_ROOT:", RESSOURCES_ROOT);
  console.log("MODE:", mode);
  if (mode === "AUDIT") console.log("AUDIT_LIMIT:", auditLimit);
  console.log("THUMBS:", thumbsEnabled ? "ENABLED" : "DISABLED");

  if (!fs.existsSync(RESSOURCES_ROOT)) {
    console.error("ERREUR: dossier 'ressources' introuvable.");
    console.error("Attendu:", RESSOURCES_ROOT);
    console.error("=> Vérifie extraction (exemple):");
    console.error(
      "   ditto -x -k import_tmp/ressources.zip import_tmp/_extract_all_v2"
    );
    process.exit(1);
  }

  const allFilesAbs = walkImportableFiles(RESSOURCES_ROOT);
  const detectedPdfCount = allFilesAbs.filter((p) => isPdfFile(p)).length;

  console.log(`Fichiers importables détectés: ${allFilesAbs.length}`);
  console.log(`Dont PDF: ${detectedPdfCount}`);

  const importFilesAbs =
    max && Number.isFinite(max) && max > 0 ? allFilesAbs.slice(0, max) : allFilesAbs;

  if (max && Number.isFinite(max) && max > 0) {
    console.log("MAX actif:", max, `(traités: ${importFilesAbs.length})`);
  }

  if (thumbsOnly) {
    console.log("THUMBS_ONLY:", "ENABLED");
  }

  if (importFilesAbs.length === 0) {
    console.error("ERREUR: aucun fichier importable détecté dans le dossier extrait.");
    process.exit(1);
  }

  ensureDir(PUBLIC_BASE_DIR);

  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  // Thumbs counters
  let thumbsWritten = 0;
  let thumbsSkipped = 0;

  // Audit counters
  let auditInDb = 0;
  let auditWouldImport = 0;
  let auditWouldUpdate = 0;

  const auditDetails: string[] = [];

  for (const absFile of importFilesAbs) {
    try {
      const rel = path
        .relative(RESSOURCES_ROOT, absFile)
        .split(path.sep)
        .join("/");
      const relParts = rel.split("/").filter(Boolean);

      const filename = relParts[relParts.length - 1];
      const fileExt = getFileExtensionLower(filename);
      const profile = detectProfileFromParts(relParts);
      const status = detectStatusFromParts(relParts);
      const accessLevel = detectAccessLevelFromParts(relParts);

      const categoryPartsForDisk = buildCategoryPartsForDisk(relParts);
      const categoryKey = buildCategoryKey(relParts);

      const safeFilename = safeSegment(filename);

      const destDir = path.join(
        PUBLIC_BASE_DIR,
        profile,
        accessLevel,
        ...categoryPartsForDisk
      );
      const destAbs = path.join(destDir, safeFilename);

      const destRelToPublic = path
        .relative(PUBLIC_BASE_DIR, destAbs)
        .split(path.sep);
      const fileUrl = `${PUBLIC_URL_BASE}/${encodeUrlPathSegments(
        destRelToPublic
      )}`;

      const title = buildTitleFromFilename(filename);
      const summary = `Import (Option B) (${profile}) - ${fileExt.replace(".", "").toUpperCase()}`;

      // Anti-doublons historique : si une ressource existe déjà en /AUTHENTICATED/, on migre son fileUrl
      await migrateAuthenticatedFileUrlIfNeeded(fileUrl);

      // Mode THUMBS ONLY : ne touche pas à la DB, génère juste les PNG pour les PDFs ciblés
      if (thumbsOnly) {
        ensureDir(destDir);

        // Si le fichier n'existe pas encore dans client/public/imported, on le copie (idempotent)
        if (!fs.existsSync(destAbs)) {
          fs.copyFileSync(absFile, destAbs);
        }

        if (isPdfFile(destAbs)) {
          const gen = tryGenerateImportedThumbPng(destAbs, fileUrl, { enabled: true });
          if (gen.written) thumbsWritten++;
          else thumbsSkipped++;
        } else {
          thumbsSkipped++;
        }

        skipped++;
        continue;
      }

      const storageKey = fileUrl.replace(/^\/+/, "");
      const thumbnailUrl =
        (db as any).deriveImportedThumbnailUrl?.(fileUrl) ?? null;

      const existing = await findExistingResource(fileUrl, storageKey);
      const alreadyInDb = !!existing;

      // 🔒 Canon visibilité (miroir strict comme backend + CHECK DB)
      const canonicalVisibility =
        accessLevel === "PUBLIC" ? "PUBLIC" : "INTERNAL_IFAC";

      // Si la ressource existe déjà via storageKey mais fileUrl est NULL => on “répare”
      if (mode === "WRITE" && existing?.id && !existing.fileUrl) {
        await patchExistingResourceFileUrlIfMissing({
          id: existing.id,
          fileUrl,
          storageKey,
          thumbnailUrl,
          visibility: canonicalVisibility,
          accessLevel,
          status,
          category: categoryKey,
        });
      }

      // Mode AUDIT : on ne touche à rien, on analyse seulement
      if (mode === "AUDIT") {
        if (alreadyInDb) {
          auditInDb++;

          // Si le fichier disque existe et diffère du ZIP => on "devrait" mettre à jour
          const same = filesAreIdentical(absFile, destAbs);
          if (!same) {
            auditWouldUpdate++;
            if (auditDetails.length < auditLimit) {
              auditDetails.push(`🔁 [UPDATE] ${fileUrl}`);
            }
          }
        } else {
          auditWouldImport++;
          if (auditDetails.length < auditLimit) {
            auditDetails.push(`➕ [NEW] ${fileUrl}`);
          }
        }
        continue;
      }

      // Mode DRY_RUN : affiche seulement
      if (mode === "DRY_RUN") {
        if (alreadyInDb) {
          skipped++;
          console.log(`⏭️  [SKIP] ${title} -> fileUrl existe déjà`);
        } else {
          imported++;
          console.log(
            `✅ [${imported}/${importFilesAbs.length}] ${title} (${profile}, ${accessLevel}, ${status}) -> categoryKey=${categoryKey}`
          );
        }
        continue;
      }

      // Mode WRITE
      if (alreadyInDb) {
        // NOUVEAUTÉ (Solution B) :
        // si le contenu du fichier a changé => on remplace le fichier sur disque
        ensureDir(destDir);

        const identical = filesAreIdentical(absFile, destAbs);
        if (!identical) {
          fs.copyFileSync(absFile, destAbs);
          updated++;
          console.log(`🔁 [UPDATE] ${title} -> fichier remplacé (fileUrl identique)`);

          // ✅ PILIER 2 béton : (re)génère la vignette canonique si possible
          if (isPdfFile(destAbs)) {
            const gen = tryGenerateImportedThumbPng(destAbs, fileUrl, {
              enabled: thumbsEnabled,
            });
            if (gen.written) thumbsWritten++;
            else thumbsSkipped++;
          } else {
            thumbsSkipped++;
          }
        } else {
          skipped++;
        }
        continue;
      }

      // Nouveau fichier => import complet (copie + DB)
      ensureDir(destDir);
      fs.copyFileSync(absFile, destAbs);

      // thumbnailUrl / storageKey / canonicalVisibility déjà calculés plus haut

const resourceId = await db.createResource(
  {
    title,
    summary,
    content: "",
    type: "document",
    visibility: canonicalVisibility,
    accessLevel,
    status,
    fileUrl,
    storageKey,
    thumbnailUrl,
    category: categoryKey,
  } as any,
  []
);

      await db.setResourceProfiles(resourceId, [profile]);

      // ✅ Auto-thèmes — Option B
      try {
        const db2 = await (db as any).getDb?.();
        if (db2) {
          const schema = await import("../../drizzle/schema").catch(() =>
            import("../drizzle/schema" as any)
          );

          const themesTable = (schema as any).themes;
          const resourceThemesTable =
            (schema as any).resourceThemes ?? (schema as any).resource_themes;

          if (themesTable && resourceThemesTable) {
            const normalizeForThemeMatch = (value: string): string =>
              String(value ?? "")
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, " ");

            const detectThemeNamesFromText = (text: string): string[] => {
              const normalized = normalizeForThemeMatch(text);

              const rules: Array<{ themeName: string; keywords: string[] }> = [
                {
                  themeName: "Harcèlement et prévention",
                  keywords: [
                    "harcelement",
                    "harceler",
                    "intimidation",
                    "moquerie",
                    "moqueries",
                    "racket",
                    "exclusion",
                    "violence verbale",
                    "violences verbales",
                  ],
                },
                {
                  themeName: "Vivre ensemble",
                  keywords: [
                    "vivre ensemble",
                    "respect",
                    "regles de vie",
                    "regle de vie",
                    "vie collective",
                    "groupe",
                    "cohesion",
                  ],
                },
                {
                  themeName: "Inclusion et handicap",
                  keywords: [
                    "inclusion",
                    "handicap",
                    "accessibilite",
                    "difference",
                    "differences",
                  ],
                },
                {
                  themeName: "Émotions et expression",
                  keywords: [
                    "emotion",
                    "emotions",
                    "colere",
                    "peur",
                    "joie",
                    "tristesse",
                    "expression",
                    "ressenti",
                  ],
                },
                {
                  themeName: "Coopération et entraide",
                  keywords: [
                    "cooperation",
                    "coopération",
                    "entraide",
                    "ensemble",
                    "solidaire",
                    "solidarite",
                    "defi collectif",
                  ],
                },
                {
                  themeName: "Citoyenneté",
                  keywords: [
                    "citoyennete",
                    "citoyenneté",
                    "citoyen",
                    "citoyens",
                    "droits",
                    "devoirs",
                    "republique",
                    "democratie",
                  ],
                },
                {
                  themeName: "Environnement",
                  keywords: [
                    "environnement",
                    "nature",
                    "ecologie",
                    "écologie",
                    "recyclage",
                    "developpement durable",
                    "développement durable",
                  ],
                },
                {
                  themeName: "Jeux et dynamisation",
                  keywords: [
                    "jeu",
                    "jeux",
                    "dynamique",
                    "energizer",
                    "brise glace",
                    "icebreaker",
                    "animation",
                  ],
                },
                {
                  themeName: "Activités artistiques",
                  keywords: [
                    "artistique",
                    "art",
                    "peinture",
                    "dessin",
                    "theatre",
                    "théâtre",
                    "musique",
                    "creation",
                    "création",
                  ],
                },
                {
                  themeName: "Activités sportives",
                  keywords: [
                    "sport",
                    "sports",
                    "sportif",
                    "sportive",
                    "motricite",
                    "motricité",
                    "physique",
                  ],
                },
              ];

              const detected = new Set<string>();

              for (const rule of rules) {
                const hasMatch = rule.keywords.some((keyword) =>
                  normalized.includes(normalizeForThemeMatch(keyword))
                );

                if (hasMatch) {
                  detected.add(rule.themeName);
                }
              }

              return Array.from(detected);
            };

            const detectedThemeNames = detectThemeNamesFromText(
              [title, filename, rel, categoryKey].filter(Boolean).join(" ")
            );

            if (detectedThemeNames.length > 0) {
              const themeRows = (await db2
                .select({
                  id: themesTable.id,
                  name: themesTable.name,
                })
                .from(themesTable)) as Array<{ id: number; name: string }>;

              const matchingThemeIds = themeRows
                .filter((row) => detectedThemeNames.includes(String(row.name ?? "").trim()))
                .map((row) => Number(row.id));

              for (const themeId of matchingThemeIds) {
                try {
                  await db2.insert(resourceThemesTable).values({
                    resourceId,
                    themeId,
                  } as any);
                } catch {
                  // ignore doublon éventuel
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("⚠️  [THEMES] auto-association non bloquante:", (e as any)?.message ?? e);
      }

      // ✅ PILIER 3 — branchement taxonomy DB (idempotent)
      const categoryPartsForTaxonomy = buildCategoryPartsForTaxonomy(relParts);
      await ensureTaxonomyLink(resourceId, profile, categoryPartsForTaxonomy);

      // ✅ PILIER 2 béton : génère la vignette canonique si possible
if (isPdfFile(destAbs)) {
  const gen = tryGenerateImportedThumbPng(destAbs, fileUrl, {
    enabled: thumbsEnabled,
  });
  if (gen.written) thumbsWritten++;
  else thumbsSkipped++;
}

// 🆕 PILIER PREVIEW BUREAUTIQUE
if (isOfficePreviewConvertible(destAbs)) {
  const preview = tryGenerateOfficePreviewPdf(destAbs, {
    enabled: thumbsEnabled,
  });

  if (preview.written) {
    console.log(`🧾 preview PDF généré pour ${destAbs}`);
  }
}

      imported++;
      console.log(
        `✅ [${imported}/${importFilesAbs.length}] ${title} (${profile}, ${accessLevel}, ${status}) -> categoryKey=${categoryKey}`
      );
    } catch (err: any) {
      failed++;
      console.error("❌ Erreur import sur:", absFile);

      // Log lisible
      console.error("[ERR message]", err?.message ?? err);

      // Log structuré (MySQL / Drizzle / driver)
      try {
        console.error(
          "[ERR details]",
          JSON.stringify(
            {
              name: err?.name,
              code: err?.code,
              errno: err?.errno,
              sqlState: err?.sqlState,
              sqlMessage: err?.sqlMessage,
              cause: err?.cause,
              stack: err?.stack,
            },
            null,
            2
          )
        );
      } catch {
        console.error("[ERR raw]", err);
      }

      // ✅ STOP au 1er échec (sinon tu te tapes 52 erreurs et on perd la vraie cause)
      process.exit(1);
    }
  }

  if (mode === "AUDIT") {
    console.log("=== AUDIT (Option B) : disque vs base (fileUrl) ===");
    for (const line of auditDetails) console.log(line);

    console.log("=== AUDIT SUMMARY ===");
    console.log("Fichiers importables détectés:", importFilesAbs.length);
    console.log("Déjà en base (fileUrl):", auditInDb);
    console.log("Nouveaux (seraient importés):", auditWouldImport);
    console.log("Modifiés (seraient remplacés):", auditWouldUpdate);
    console.log(
      "Détails affichés:",
      auditDetails.length,
      "/",
      auditWouldImport + auditWouldUpdate
    );

    const auditPayload = {
      mode: "AUDIT",
      extractRoot: EXTRACT_ROOT,
      ressourcesRoot: RESSOURCES_ROOT,
      detectedFiles: importFilesAbs.length,
      detectedPdfs: importFilesAbs.filter((p) => isPdfFile(p)).length,
      inDb: auditInDb,
      wouldImport: auditWouldImport,
      wouldUpdate: auditWouldUpdate,
      detailsShown: auditDetails.length,
      detailsTotal: auditWouldImport + auditWouldUpdate,
      details: auditDetails,
    };

    // Marqueur stable pour lecture machine côté API / UI
    console.log("AUDIT_RESULT_JSON_START");
    console.log(JSON.stringify(auditPayload, null, 2));
    console.log("AUDIT_RESULT_JSON_END");

    // Export audit log (pour historique / debug / future UI admin)
    try {
      const outDir = path.join(PROJECT_ROOT, "import_tmp");
      ensureDir(outDir);

      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const outPath = path.join(outDir, `audit_import_optionB_${stamp}.json`);

      fs.writeFileSync(outPath, JSON.stringify(auditPayload, null, 2), "utf-8");
      console.log("AUDIT_LOG_WRITTEN:", outPath);
    } catch (e) {
      console.warn("AUDIT_LOG_WRITE_FAILED:", (e as any)?.message ?? e);
    }
    process.exit(0);
  }

  console.log("=== FIN IMPORT ===");
  console.log("Importés (nouveaux):", imported);
  console.log("Mis à jour (PDF remplacés):", updated);
  console.log("Skippés (inchangés):", skipped);
  console.log("Échecs:", failed);
  console.log("Thumbs écrits:", thumbsWritten);
  console.log("Thumbs non écrits:", thumbsSkipped);

  // Export run log (pour historique / future UI admin)
  try {
    const outDir = path.join(PROJECT_ROOT, "import_tmp");
    ensureDir(outDir);

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outPath = path.join(outDir, `import_run_optionB_${stamp}.json`);

    const payload = {
      extractRoot: EXTRACT_ROOT,
      ressourcesRoot: RESSOURCES_ROOT,
      detectedFiles: importFilesAbs.length,
      detectedPdfs: importFilesAbs.filter((p) => isPdfFile(p)).length,
      mode,
      imported,
      updated,
      skipped,
      failed,
      thumbs: {
        enabled: thumbsEnabled,
        written: thumbsWritten,
        skipped: thumbsSkipped,
      },
    };

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf-8");
    console.log("IMPORT_RUN_LOG_WRITTEN:", outPath);
  } catch (e) {
    console.warn("IMPORT_RUN_LOG_WRITE_FAILED:", (e as any)?.message ?? e);
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
