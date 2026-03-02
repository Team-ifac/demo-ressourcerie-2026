/**
 * Migration Phase 1 (PRO) : resources.category JSON[] -> categoryKey string canonique
 *
 * Cible :
 *   resources WHERE fileUrl LIKE '/imported/%'
 *
 * Effet :
 *   - Si category est un JSON array ["A","B",...] => convertit en "a/b" slugifié
 *   - Si category est déjà une string non-JSON => laisse tel quel
 *
 * Usage (Terminal TRAVAIL):
 *   pnpm -s tsx server/_scripts/migrate_categories_optionB_phase1.ts --dry-run
 *   pnpm -s tsx server/_scripts/migrate_categories_optionB_phase1.ts
 */

import dotenv from "dotenv";
dotenv.config();

import * as dbModule from "../db";

function slugifySegment(input: string): string {
  const s = (input ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .trim();

  return s || "autre";
}

function toCategoryKeyFromJsonArray(arr: unknown): string | null {
  if (!Array.isArray(arr)) return null;
  const parts = arr
    .map((x) => (typeof x === "string" ? x : ""))
    .map((s) => s.trim())
    .filter(Boolean)
    .map(slugifySegment)
    .filter(Boolean);

  if (parts.length === 0) return "autre";
  return parts.join("/");
}

function looksLikeJsonArrayString(s: string): boolean {
  const t = (s ?? "").trim();
  return t.startsWith("[") && t.endsWith("]");
}

async function getDbDirect() {
  const getDb = (dbModule as any).getDb;
  if (typeof getDb !== "function") {
    throw new Error("db.getDb() introuvable (server/db.ts).");
  }
  const db = await getDb();
  if (!db) throw new Error("Database not available (getDb returned null).");
  return db;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  const db = await getDbDirect();

  // On charge le schema Drizzle (chemin standard)
  const schema = await import("../../drizzle/schema");
  const resources = (schema as any).resources;
  if (!resources) throw new Error("schema.resources introuvable.");

  const { like, eq } = await import("drizzle-orm");

  console.log("=== MIGRATION category JSON -> categoryKey (Phase 1) ===");
  console.log("MODE:", dryRun ? "DRY_RUN" : "WRITE");

  // Récupérer toutes les ressources imported
  const rows = await db
    .select({
      id: resources.id,
      category: resources.category,
      fileUrl: resources.fileUrl,
    })
    .from(resources)
    .where(like(resources.fileUrl, "/imported/%"));

  console.log("Ressources ciblées:", rows.length);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of rows) {
    try {
      const id = Number(r.id);
      const catRaw = (r.category ?? "") as string;

      // Déjà une clé canonique (non JSON) => skip
      if (
        typeof catRaw === "string" &&
        catRaw.trim().length > 0 &&
        !looksLikeJsonArrayString(catRaw)
      ) {
        skipped++;
        continue;
      }

      let nextKey: string | null = null;

      if (typeof catRaw === "string" && looksLikeJsonArrayString(catRaw)) {
        try {
          const parsed = JSON.parse(catRaw);
          nextKey = toCategoryKeyFromJsonArray(parsed);
        } catch {
          nextKey = null;
        }
      } else if (!catRaw || String(catRaw).trim() === "") {
        nextKey = "autre";
      }

      if (!nextKey) {
        failed++;
        console.warn(
          `❌ [${id}] category illisible -> SKIP (cat=${String(catRaw).slice(0, 80)})`
        );
        continue;
      }

      if (dryRun) {
        updated++;
        console.log(`✅ [DRY] ${id} -> ${nextKey}`);
        continue;
      }

      await db.update(resources).set({ category: nextKey }).where(eq(resources.id, id));
      updated++;
    } catch (e: any) {
      failed++;
      console.error("❌ Erreur migration row:", r?.id, e?.message ?? e);
    }
  }

  console.log("=== FIN MIGRATION ===");
  console.log("Updated:", updated);
  console.log("Skipped:", skipped);
  console.log("Failed:", failed);

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
