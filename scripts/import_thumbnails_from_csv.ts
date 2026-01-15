import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });

import { getDb } from "../server/db";
import { resources } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const CSV_PATH = path.resolve(process.cwd(), "ressources_images.csv");

type CsvRow = {
  resource_name: string;
  image_url: string;
};

function normalize(s: string) {
  return (s ?? "")
    .trim()
    .toLowerCase()
    // retire les accents
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // uniformise apostrophes et tirets
    .replace(/[’']/g, "'")
    .replace(/[–—−]/g, "-")
    // retire ponctuation "non utile"
    .replace(/[“”"]/g, "")
    .replace(/[.,;:!?()[\]{}]/g, "")
    // espaces propres
    .replace(/\s+/g, " ")
    .trim();
}

async function run() {
  console.log("📥 Lecture du fichier CSV…");
  console.log("📄 CSV attendu :", CSV_PATH);
  console.log("🔐 DATABASE_URL présent :", !!process.env.DATABASE_URL);

  if (!fs.existsSync(CSV_PATH)) {
    console.error("❌ Fichier CSV introuvable :", CSV_PATH);
    process.exit(1);
  }

  const db = await getDb();
  if (!db) {
    console.error("❌ Base de données indisponible (getDb() = null)");
    console.error("➡️ Vérifie server/.env (DATABASE_URL) et MySQL.");
    process.exit(1);
  }

  // 1) Lire CSV
  const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
  const rows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvRow[];
  console.log(`🔎 ${rows.length} lignes trouvées dans le CSV`);

  // 2) Charger toutes les ressources (id + title) pour faire un index normalisé
  console.log("📚 Chargement des titres depuis la base…");
  const all = await db.select({ id: resources.id, title: resources.title }).from(resources);

  const index = new Map<string, Array<{ id: number; title: string }>>();
  for (const r of all) {
    const key = normalize(r.title);
    const arr = index.get(key) ?? [];
    arr.push({ id: r.id, title: r.title });
    index.set(key, arr);
  }

  let updated = 0;
  let notFound = 0;
  let ambiguous = 0;
  let skipped = 0;

  // évite de traiter deux fois le même titre CSV
  const seen = new Set<string>();

  for (const row of rows) {
    const rawTitle = (row.resource_name ?? "").trim();
    const thumbnailUrl = (row.image_url ?? "").trim();

    if (!rawTitle || !thumbnailUrl) {
      skipped++;
      continue;
    }

    // Sécurité : jamais d’image profil
    if (thumbnailUrl.includes("/thumbnails/profile-")) {
      console.warn(`⛔ Refus image profil (ignorée) : "${rawTitle}" -> ${thumbnailUrl}`);
      skipped++;
      continue;
    }

    const key = normalize(rawTitle);
    if (!key) {
      skipped++;
      continue;
    }

    if (seen.has(key)) {
      // doublon CSV
      skipped++;
      continue;
    }
    seen.add(key);

    const matches = index.get(key);

    if (!matches || matches.length === 0) {
      console.warn(`⚠️ Non trouvée (normalisé) : "${rawTitle}"`);
      notFound++;
      continue;
    }

    if (matches.length > 1) {
      // Rare mais possible : plusieurs ressources ont le même title normalisé
      ambiguous++;
      console.warn(
        `⚠️ Ambigu (plusieurs matches). Je prends le 1er : "${rawTitle}" -> "${matches[0].title}"`
      );
    }

    const target = matches[0];

    await db.update(resources).set({ thumbnailUrl }).where(eq(resources.id, target.id));
    updated++;
    console.log(`✅ [${updated}] ${target.title}`);
  }

  console.log("———");
  console.log(`🎯 Mises à jour : ${updated}`);
  console.log(`❓ Non trouvées : ${notFound}`);
  console.log(`⚠️ Ambiguës : ${ambiguous}`);
  console.log(`⏭️ Ignorées/vides/doublons/refusées : ${skipped}`);
  console.log("✅ Import terminé");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Erreur import :", err);
  process.exit(1);
});
