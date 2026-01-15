/**
 * Import Option A (démo-safe) - VERSION "IMPORT DEPUIS DOSSIER EXTRAIT"
 *
 * Objectif:
 * - Ne plus extraire fichier par fichier via `unzip` (problèmes d'encodage accents)
 * - Importer depuis: import_tmp/_extract_all/ressources/...
 *
 * Règles:
 * - 1 PDF = 1 ressource
 * - profile = dossier racine (animateur/formateur/directeur/stagiaire_bafa)
 * - _A_CLASSER => profile=formateur, status=draft
 * - ailleurs => status=approved
 * - accessLevel=PUBLIC partout
 * - ignore __MACOSX et fichiers "._"
 *
 * Usage:
 *   pnpm tsx server/_scripts/import_zip_optionA.ts
 */

import dotenv from "dotenv";
dotenv.config();

import fs from "node:fs";
import path from "node:path";
import * as db from "../db";

// Chemins (on est dans le projet)
const PROJECT_ROOT = process.cwd();

// Dossier où tu as extrait le ZIP avec ditto
const EXTRACT_ROOT = path.join(PROJECT_ROOT, "import_tmp", "_extract_all");

// On attend un sous-dossier "ressources" dedans
const RESSOURCES_ROOT = path.join(EXTRACT_ROOT, "ressources");

// Où on copie les PDFs pour qu’ils soient accessibles via le front
// (client/public est servi en statique)
const PUBLIC_BASE_DIR = path.join(PROJECT_ROOT, "client", "public", "imported");
const PUBLIC_URL_BASE = "/imported";

type ProfileType = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

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

function safeSlugFilename(filename: string): string {
  // Démo-safe: on garde lisible, on neutralise seulement ce qui peut casser un chemin
  return filename
    .replace(/\s+/g, " ")
    .replace(/[<>:"|?*\u0000-\u001F]/g, "_")
    .replace(/\//g, "_")
    .trim();
}

function detectProfileFromRelPath(relFromRessourcesRoot: string): ProfileType {
  // relFromRessourcesRoot exemple: "formateur/document/.../fichier.pdf"
  // ou "_A_CLASSER/fichier.pdf"
  const parts = relFromRessourcesRoot.split("/").filter(Boolean);
  const first = parts[0];

  if (!first) return "formateur";
  if (first === "animateur") return "animateur";
  if (first === "formateur") return "formateur";
  if (first === "directeur") return "directeur";
  if (first === "stagiaire_bafa") return "stagiaire_bafa";

  // _A_CLASSER => formateur
  return "formateur";
}

function isAClasserRel(relFromRessourcesRoot: string): boolean {
  return relFromRessourcesRoot.startsWith("_A_CLASSER/");
}

function buildTitleFromFilename(filename: string): string {
  return filename.replace(/\.pdf$/i, "").trim() || "Sans titre";
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
        // ignore __MACOSX au niveau dossier
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

  // Tri stable (utile pour logs)
  results.sort((a, b) => a.localeCompare(b));
  return results;
}

async function main() {
  console.log("=== Import Option A (depuis dossier extrait) ===");
  console.log("EXTRACT_ROOT:", EXTRACT_ROOT);
  console.log("RESSOURCES_ROOT:", RESSOURCES_ROOT);

  if (!fs.existsSync(RESSOURCES_ROOT)) {
    console.error("ERREUR: dossier 'ressources' introuvable.");
    console.error("Attendu:", RESSOURCES_ROOT);
    console.error("=> Vérifie que tu as bien fait:");
    console.error("   ditto -x -k import_tmp/ressources.zip import_tmp/_extract_all");
    process.exit(1);
  }

  // 1) Lister les PDFs depuis le disque
  const pdfFilesAbs = walkPdfs(RESSOURCES_ROOT);

  console.log(`PDFs détectés: ${pdfFilesAbs.length}`);

  if (pdfFilesAbs.length === 0) {
    console.error("ERREUR: aucun PDF détecté dans le dossier extrait.");
    process.exit(1);
  }

  // 2) Copier + créer les ressources
  let imported = 0;
  let failed = 0;

  for (const absPdf of pdfFilesAbs) {
    try {
      const relFromRessourcesRoot = path
        .relative(RESSOURCES_ROOT, absPdf)
        .split(path.sep)
        .join("/"); // normalise en "/"

      const filename = path.basename(absPdf);
      const profile = detectProfileFromRelPath(relFromRessourcesRoot);

      // _A_CLASSER => draft, sinon approved (conforme à l'enum DB)
      const status = isAClasserRel(relFromRessourcesRoot) ? "draft" : "approved";

      // accessLevel toujours PUBLIC (Option A)
      const accessLevel = "PUBLIC";

      // On copie les fichiers dans un sous-dossier par profil
      const safeName = safeSlugFilename(filename);
      const publicDir = path.join(PUBLIC_BASE_DIR, profile);
      ensureDir(publicDir);

      const finalPath = path.join(publicDir, safeName);
      fs.copyFileSync(absPdf, finalPath);

      // URL publique
      const fileUrl = `${PUBLIC_URL_BASE}/${profile}/${encodeURIComponent(safeName)}`;

      // Créer la ressource
      const title = buildTitleFromFilename(filename);
      const summary = `Import (Option A) (${profile})`;
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
          category: JSON.stringify([]),
        } as any,
        []
      );

      await db.setResourceProfiles(resourceId, [profile]);

      imported++;
      console.log(`✅ [${imported}/${pdfFilesAbs.length}] ${title} (${profile}, ${status})`);
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
