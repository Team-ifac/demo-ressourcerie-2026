import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { createResource, setResourceProfiles } from "../db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_PATH = path.resolve(__dirname, "../../generated_resources.json");

type GeneratedResource = {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  duration?: string;
  ageRange?: string;
  type?: string;
  energy?: number;
  accessLevel?: "PUBLIC" | "INTERNAL_IFAC" | "PREMIUM";
};

type ProfileKey = "animateur" | "formateur" | "directeur" | "stagiaire_bafa";

function inferProfilesFromCategory(_category: string): ProfileKey[] {
  return ["animateur", "formateur", "directeur", "stagiaire_bafa"];
}

function buildTypeLabel(input: string | undefined): string {
  const normalized = String(input ?? "").trim().toLowerCase();

  if (normalized === "calme") return "activité calme";
  if (normalized === "dynamique") return "activité dynamique";

  return normalized || "activité";
}

function formatMySqlDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

async function main() {
  console.log("📦 Import generated resources — démarrage\n");

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL absente. Vérifie que ton fichier .env est bien présent à la racine du projet."
    );
  }

  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`Fichier introuvable: ${INPUT_PATH}`);
  }

  const raw = fs.readFileSync(INPUT_PATH, "utf-8");
  const resourcesData = JSON.parse(raw) as GeneratedResource[];

  if (!Array.isArray(resourcesData) || resourcesData.length === 0) {
    throw new Error("generated_resources.json doit contenir un tableau JSON non vide");
  }

  console.log(`📄 ${resourcesData.length} ressources à importer\n`);

  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < resourcesData.length; i++) {
    const resource = resourcesData[i];

    try {
      const now = formatMySqlDateTime(new Date());

      const resourceId = await createResource(
        {
          title: resource.title,
          summary: resource.summary,
          content: resource.content,
          type: buildTypeLabel(resource.type),
          ageRange: resource.ageRange ?? null,
          duration: resource.duration ?? null,
          category: resource.category ?? null,
          visibility: "PUBLIC",
          accessLevel: resource.accessLevel ?? "PUBLIC",
          status: "approved",
          fileUrl: null,
          thumbnailUrl: null,
          viewCount: 0,
          downloadCount: 0,
          createdAt: now,
          updatedAt: now,
        },
        []
      );

      const profiles = inferProfilesFromCategory(resource.category);
      await setResourceProfiles(resourceId, profiles);

      imported++;
      console.log(`✅ [${i + 1}/${resourcesData.length}] ${resource.title}`);
    } catch (error) {
      failed++;
      const errorMsg =
        error instanceof Error ? error.message : "Erreur inconnue";
      errors.push(`${resource.title}: ${errorMsg}`);
      console.log(
        `❌ [${i + 1}/${resourcesData.length}] ${resource.title} - ${errorMsg}`
      );
    }
  }

  console.log("\n📊 Résumé de l'import :");
  console.log(`✅ Importées : ${imported}`);
  console.log(`❌ Échouées : ${failed}`);
  console.log(`📈 Total : ${resourcesData.length}`);

  if (errors.length > 0) {
    console.log("\n⚠️ Erreurs :");
    errors.forEach((err) => console.log(`- ${err}`));
  }
}

main().catch((error) => {
  console.error("\n❌ Erreur fatale :");
  console.dir(error, { depth: null });
  process.exit(1);
});