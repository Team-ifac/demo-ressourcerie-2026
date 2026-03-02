import { getDb } from "../db";
import * as schema from "../../drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("🔎 Canonicalisation des fichiers ressources...");

  const db = await getDb();
  if (!db) {
    console.error("❌ Database not available");
    process.exit(1);
  }

  const resourcesTable: any =
    (schema as any).resourcesTable ||
    (schema as any).resources;

  if (!resourcesTable) {
    console.error("❌ Table resources introuvable dans le schema");
    process.exit(1);
  }

  const rows = await db.select().from(resourcesTable);

  console.log(`📦 ${rows.length} ressources trouvées`);

  let updated = 0;
  let skipped = 0;

  for (const r of rows as any[]) {
    const id = r.id;

    const storageKey =
      r.storageKey && String(r.storageKey).trim().length > 0
        ? String(r.storageKey).trim()
        : null;

    const fileUrl =
      r.fileUrl && String(r.fileUrl).trim().length > 0
        ? String(r.fileUrl).trim()
        : null;

    // ✅ CAS 1 : storageKey déjà présent → OK
    if (storageKey) {
      skipped++;
      continue;
    }

    // ✅ CAS 2 : fileUrl existe → on le migre vers storageKey
    if (fileUrl) {
      await db
        .update(resourcesTable)
        .set({
          storageKey: fileUrl,
          fileUrl: null,
        })
        .where(eq(resourcesTable.id, id));

      console.log(`✔️ Resource ${id} migrée vers storageKey`);
      updated++;
      continue;
    }

    // ✅ CAS 3 : aucun fichier
    skipped++;
  }

  console.log("——————————————");
  console.log("✅ Migration terminée");
  console.log("Modifiées :", updated);
  console.log("Ignorées  :", skipped);

  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Erreur :", err);
  process.exit(1);
});
