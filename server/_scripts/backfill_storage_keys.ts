import "dotenv/config";
import { and, eq, like, or, sql } from "drizzle-orm";
import { getDb } from "../db";
import { resources } from "../../drizzle/schema";

/**
 * Pilier 12 — Backfill storageKey / thumbnailKey (legacy -> canonique)
 *
 * - storageKey : identifiant stable du PDF (ex: "imported/animateur/PUBLIC/....pdf")
 * - thumbnailKey : identifiant stable de la vignette (si un jour tu en as)
 *
 * Par défaut : AUDIT (ne modifie rien)
 * Pour appliquer : --apply
 *
 * Usage :
 *   pnpm tsx server/_scripts/backfill_storage_keys.ts
 *   pnpm tsx server/_scripts/backfill_storage_keys.ts --apply
 */

function normalizeKeyFromPath(raw: string): string {
  // ex: "/imported/a/b.pdf" -> "imported/a/b.pdf"
  // ex: "imported/a/b.pdf"  -> "imported/a/b.pdf"
  return (raw || "").trim().replace(/^\/+/, "");
}

async function main() {
  const apply = process.argv.includes("--apply");
  const db = await getDb();
  if (!db) throw new Error("DB non disponible");

  // 1) Candidats : fileUrl legacy /imported ou imported + storageKey vide
  const candidates = await db
    .select({
      id: resources.id,
      title: resources.title,
      fileUrl: resources.fileUrl,
      storageKey: (resources as any).storageKey,
      thumbnailUrl: resources.thumbnailUrl,
      thumbnailKey: (resources as any).thumbnailKey,
    })
    .from(resources)
    .where(
      and(
        or(
          like(sql`TRIM(${resources.fileUrl})`, "/imported/%"),
          like(sql`TRIM(${resources.fileUrl})`, "imported/%")
        ),
        or(
          eq(sql`(${resources as any}.storageKey IS NULL)`, sql`true`),
          eq(sql`TRIM(${(resources as any).storageKey})`, "")
        )
      )
    );

  console.log(`\n=== PILIER 12 — BACKFILL storageKey ===`);
  console.log(`Mode: ${apply ? "APPLY (écrit en base)" : "AUDIT (ne modifie rien)"}`);
  console.log(`Candidats trouvés: ${candidates.length}\n`);

  if (candidates.length === 0) {
    console.log("Rien à faire ✅");
    return;
  }

  // 2) Preview (10 premières)
  console.log("Preview (10 premières) :");
  candidates.slice(0, 10).forEach((r) => {
    const fileUrl = String(r.fileUrl || "").trim();
    const storageKey = normalizeKeyFromPath(fileUrl);
    console.log(`- #${r.id} ${r.title}`);
    console.log(`  fileUrl     = ${fileUrl}`);
    console.log(`  storageKey  = ${storageKey}`);
  });
  console.log("");

  if (!apply) {
    console.log("AUDIT terminé ✅");
    console.log("Pour appliquer en base :");
    console.log("  pnpm tsx server/_scripts/backfill_storage_keys.ts --apply\n");
    return;
  }

  // 3) Apply
  let updated = 0;
  for (const r of candidates) {
    const fileUrl = String(r.fileUrl || "").trim();
    const storageKey = normalizeKeyFromPath(fileUrl);

    if (!storageKey) continue;

    await db
      .update(resources)
      .set({ storageKey } as any)
      .where(eq(resources.id, Number(r.id)));

    updated++;
  }

  console.log(`✅ APPLY terminé. Lignes mises à jour: ${updated}\n`);
}

main().catch((err) => {
  console.error("❌ Erreur:", err);
  process.exit(1);
});
