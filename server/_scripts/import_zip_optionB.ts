/**
 * Import Option B (démo-safe) - IMPORT DEPUIS DOSSIER EXTRAIT
 *
 * Objectif:
 * - Importer depuis: import_tmp/_extract_all/ressources/...
 *
 * Règles:
 * - 1 PDF = 1 ressource
 * - profile = dossier racine (animateur/formateur/directeur/stagiaire_bafa)
 * - _A_CLASSER => status=draft (et accessLevel=PUBLIC par défaut)
 * - Sinon:
 *    - accessLevel = PUBLIC | AUTHENTICATED | PREMIUM (depuis l'arborescence)
 *    - status = publie -> approved ; brouillon -> draft ; (sinon approved)
 * - fileUrl CONSERVE LES SOUS-DOSSIERS (important pour une démo "rangée")
 * - category = segments restants (catégories) sous forme JSON ["cat1/cat2/..."]
 * - ignore __MACOSX et fichiers "._"
 *
 * Usage:
 *   pnpm tsx server/_scripts/import_zip_optionB.ts
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";
import * as db from "../db";

const PROJECT_ROOT = process.cwd();
const EXTRACT_ROOT = path.join(PROJECT_ROOT, "import_tmp", "_extract_all");
const RESSOURCES_ROOT = EXTRACT_ROOT;

const PUBLIC_BASE_DIR = path.join(PROJECT_ROOT, "client", "public", "imported");
const PUBLIC_URL_BASE = "/imported";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";
type AccessLevel = "PUBLIC" | "AUTHENTICATED" | "PREMIUM";
type Status = "draft" | "approved";

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function isIgnoredFsPath(absPath: string): boolean {
  const base = path.basename(absPath);
  if (!absPath) return true;
  if (absPath.includes(`${path.sep}__MACOSX${path.sep}`)) return true;
  if (base.startsWith("._")) return true;
  if (!base.toLowerCase().endsWith(".pdf")) return true;
  return false;
}

function safeSlugSegment(seg: string): string {
  // segment de chemin (dossier OU fichier) : on garde accents, on supprime caractères interdits
  return seg
    .replace(/\s+/g, " ")
    .replace(/[<>:"|?*\u0000-\u001F]/g, "_")
    .replace(/\//g, "_")
    .trim();
}

function walkPdfs(dir: string): string[] {
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

function detectProfileFromParts(parts: string[]): ProfileType {
  const first = parts[0];
  if (first === "animateur") return "animateur";
  if (first === "formateur") return "formateur";
  if (first === "directeur") return "directeur";
  if (first === "stagiaire_bafa") return "stagiaire_bafa";
  // fallback démo-safe
  return "formateur";
}

function detectStatusFromParts(parts: string[]): Status {
  if (parts.includes("_A_CLASSER")) return "draft";
  if (parts.includes("brouillon")) return "draft";
  if (parts.includes("publie")) return "approved";
  // défaut raisonnable
  return "approved";
}

function detectAccessLevelFromParts(parts: string[]): AccessLevel {
  // Supporte 2 styles: PUBLIC/AUTHENTICATED/PREMIUM OU public/connecte/premium
  const lower = parts.map((p) => p.toLowerCase());

  if (parts.includes("PREMIUM") || lower.includes("premium")) return "PREMIUM";
  if (parts.includes("AUTHENTICATED") || lower.includes("connecte") || lower.includes("authenticated"))
    return "AUTHENTICATED";
  if (parts.includes("PUBLIC") || lower.includes("public")) return "PUBLIC";

  // _A_CLASSER => PUBLIC
  if (parts.includes("_A_CLASSER")) return "PUBLIC";

  return "PUBLIC";
}

function buildCategoryFromParts(parts: string[]): string[] {
  // parts = [profile, ...rest..., filename.pdf]
  // On supprime:
  // - profile
  // - publie / brouillon / _A_CLASSER
  // - PUBLIC / AUTHENTICATED / PREMIUM (ou public/connecte/premium)
  // Il reste des segments "catégories"
  const stop = new Set([
    "publie",
    "brouillon",
    "_A_CLASSER",
    "PUBLIC",
    "AUTHENTICATED",
    "PREMIUM",
    "public",
    "connecte",
    "authenticated",
    "premium",
  ]);

  const rest = parts.slice(1, -1); // sans profile, sans filename
  const catParts = rest.filter((p) => !stop.has(p) && !stop.has(p.toLowerCase()));

  if (catParts.length === 0) return [];
  // 1 seule "catégorie" = chemin join
  return [catParts.join("/")];
}
function cleanText(s: string): string {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents combinés
    // corrige des artefacts fréquents d'encodage (démo-friendly)
    .replace(/Ã©/g, "e")
    .replace(/Ã¨/g, "e")
    .replace(/Ãª/g, "e")
    .replace(/Ã /g, "a")
    .replace(/Ã¢/g, "a")
    .replace(/Ã´/g, "o")
    .replace(/Ã»/g, "u")
    .replace(/â€™/g, "'")
    .replace(/â€“/g, "-")
    .replace(/â€”/g, "-")
    .replace(/[�╠╡]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildTitleFromFilename(filename: string): string {
  const raw = filename.replace(/\.pdf$/i, "").trim();
  const cleaned = cleanText(raw);
  return cleaned || "Sans titre";
}


async function main() {
  console.log("=== Import Option B (depuis dossier extrait) ===");
  console.log("EXTRACT_ROOT:", EXTRACT_ROOT);
  console.log("RESSOURCES_ROOT:", RESSOURCES_ROOT);

  if (!fs.existsSync(RESSOURCES_ROOT)) {
    console.error("ERREUR: dossier 'ressources' introuvable.");
    console.error("Attendu:", RESSOURCES_ROOT);
    console.error("=> Vérifie que tu as bien fait:");
    console.error("   ditto -x -k import_tmp/ressources.zip import_tmp/_extract_all");
    process.exit(1);
  }

  const pdfFilesAbs = walkPdfs(RESSOURCES_ROOT);
  console.log(`PDFs détectés: ${pdfFilesAbs.length}`);

  if (pdfFilesAbs.length === 0) {
    console.error("ERREUR: aucun PDF détecté dans le dossier extrait.");
    process.exit(1);
  }

  let imported = 0;
  let failed = 0;

  for (const absPdf of pdfFilesAbs) {
    try {
      // rel: ex "formateur/publie/PUBLIC/droit/mon.pdf"
      const rel = path.relative(RESSOURCES_ROOT, absPdf).split(path.sep).join("/");
      const relParts = rel.split("/").filter(Boolean);

      const filename = relParts[relParts.length - 1];
      const profile = detectProfileFromParts(relParts);

      const status = detectStatusFromParts(relParts);
      const accessLevel = detectAccessLevelFromParts(relParts);
      const categoryArr = buildCategoryFromParts(relParts);

      // On conserve les sous-dossiers: public path = imported/<profile>/<reste_du_chemin_sans_profile>/<filename>
      const safeParts = relParts.map(safeSlugSegment);
      const safeFilename = safeParts[safeParts.length - 1];

      // On retire du chemin public les tokens techniques + le statut (publie/brouillon)
// Objectif: /imported/<profile>/<ACCESSLEVEL>/<categories...>/<filename.pdf>
const restClean = safeParts
  .slice(1, -1) // après profile, sans filename
  .filter(
    (p) =>
      // on retire les tokens techniques
      p !== "publie" &&
      p !== "brouillon" &&
      p !== "public" &&
      p !== "connecte" &&
      p !== "premium" &&
      // on retire AUSSI les niveaux d'accès présents dans l'arborescence (souvent en MAJ)
      p !== "PUBLIC" &&
      p !== "AUTHENTICATED" &&
      p !== "PREMIUM"
  )
  .map((p) => cleanText(p)); // nettoie aussi les dossiers "cassés"


const publicDir = path.join(PUBLIC_BASE_DIR, profile, accessLevel, ...restClean);
ensureDir(publicDir);

const finalPath = path.join(publicDir, safeFilename);
fs.copyFileSync(absPdf, finalPath);

const encodedRest = restClean.map((s) => encodeURIComponent(s)).join("/");
const fileUrl =
  encodedRest.length > 0
    ? `${PUBLIC_URL_BASE}/${profile}/${accessLevel}/${encodedRest}/${encodeURIComponent(safeFilename)}`
    : `${PUBLIC_URL_BASE}/${profile}/${accessLevel}/${encodeURIComponent(safeFilename)}`;


      const title = buildTitleFromFilename(filename);
      const summary = `Import (Option B) (${profile})`;
      const content = "";

      const resourceId = await db.createResource(
        {
          title,
          summary,
          content,
          type: "document",
          visibility: "PUBLIC",
          accessLevel,
          status,
          fileUrl,
          thumbnailUrl: null,
          category: JSON.stringify(categoryArr),
        } as any,
        []
      );

      await db.setResourceProfiles(resourceId, [profile]);

      imported++;
      console.log(
        `✅ [${imported}/${pdfFilesAbs.length}] ${title} (${profile}, ${accessLevel}, ${status})`
      );
    } catch (err: any) {
      failed++;
      console.error("❌ Erreur import sur:", absPdf);
      console.error(err?.message ?? err);
    }
  }

  console.log("=== FIN IMPORT ===");
  console.log("Importés:", imported);
  console.log("Échecs:", failed);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
