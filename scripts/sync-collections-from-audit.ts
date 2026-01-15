// scripts/sync-collections-from-audit.ts
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";

import { getDb } from "../server/db";
import { collections, users } from "../drizzle/schema";

// 1) Charger .env (indispensable pour DATABASE_URL quand on lance un script)
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const AUDIT_CSV = path.resolve(process.cwd(), "import_tmp/audit_import.csv");

function parseCsvLine(line: string): string[] {
  // CSV simple : gère les champs avec guillemets et virgules
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      // "" => guillemet échappé
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
      continue;
    }

    cur += ch;
  }

  out.push(cur);
  return out.map((s) => s.trim());
}
function sanitizeName(name: string) {
  // Nettoyage “démo” : enlève les caractères de remplacement issus d’un mauvais encodage ZIP
  // On préfère supprimer ces symboles plutôt que de créer des collections moches.
  return (name || "")
    .replace(/\uFFFD/g, "") // caractère �
    .replace(/\?{2,}/g, "") // suites "??" (souvent dues aux accents cassés dans certains exports)
    .replace(/\s+/g, " ")
    .trim();
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b, "fr"));
}

async function main() {
  const APPLY = process.argv.includes("--apply");

  console.log("=== SYNC COLLECTIONS FROM AUDIT ===");
  console.log("CSV:", AUDIT_CSV);
  console.log("Mode:", APPLY ? "APPLY (écriture DB)" : "DRY-RUN (aucune écriture)");

  if (!fs.existsSync(AUDIT_CSV)) {
    console.error(`CSV introuvable: ${AUDIT_CSV}`);
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error("Database not available (DATABASE_URL manquant ou connexion impossible).");
    process.exit(1);
  }

  // 2) Trouver un user admin pour posséder les collections créées
  const adminRows = await db.select().from(users).where(eq(users.role, "admin")).limit(1);
  if (adminRows.length === 0) {
    console.error("Aucun user admin trouvé en base (users.role='admin').");
    process.exit(1);
  }
  const adminUserId = Number((adminRows[0] as any).id);
  console.log("Admin owner userId:", adminUserId);

  // 3) Lire le CSV et extraire collectionName
  const raw = fs.readFileSync(AUDIT_CSV, "utf8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    console.error("CSV vide ou sans données.");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const colIndex = header.findIndex((h) => h === "collectionName");
  if (colIndex === -1) {
    console.error("Colonne 'collectionName' introuvable dans le CSV.");
    console.log("Header détecté:", header);
    process.exit(1);
  }

  const names: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const row = parseCsvLine(lines[i]);
    const name = sanitizeName((row[colIndex] || "").trim());
    if (!name) continue;
    names.push(name);
  }

  const collectionNames = uniqSorted(names);
  console.log("Collections uniques détectées:", collectionNames.length);

  // 4) Lire les collections existantes
  const existing = await db.select().from(collections);
  const existingNames = new Set(existing.map((c: any) => String(c.name).trim()));

  const toCreate = collectionNames.filter((n) => !existingNames.has(n));
  console.log("Collections déjà en base:", existingNames.size);
  console.log("Collections à créer:", toCreate.length);

  if (!APPLY) {
    console.log("\n--- DRY-RUN: aperçu des 30 premières collections à créer ---");
    toCreate.slice(0, 30).forEach((n, idx) => console.log(`${idx + 1}. ${n}`));
    console.log("\nPour appliquer réellement, relance avec :");
    console.log("pnpm tsx scripts/sync-collections-from-audit.ts --apply");
    return;
  }

  // 5) Création en base
  let created = 0;

  for (const name of toCreate) {
    try {
      await db.insert(collections).values({
        userId: adminUserId as any,
        name,
        description: "Import ZIP (auto) - collections alignées depuis audit",
        isPublic: "true" as any,
      });
      created++;
    } catch (e: any) {
      console.warn("Création impossible (skip):", name, e?.code || e?.message || e);
    }
  }

  console.log(`\nOK. Collections créées: ${created}/${toCreate.length}`);
}

main().catch((e) => {
  console.error("Erreur script:", e);
  process.exit(1);
});
