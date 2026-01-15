import { getDb } from "../server/db.ts";
import { resources } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";

const db = await getDb();
if (!db) {
  console.error("Database not available");
  process.exit(1);
}

// Mapping des ressources vers leurs catégories appropriées
const resourceCategories = {
  1: "Jeux et activités sportives", // Jeu du parachute
  2: "Activités manuelles et créatives", // Fabrication de cerf-volant
  3: "Grands jeux et animations", // La quête des quatre éléments
  4: "Chants, musique et veillées", // Répertoire de chants et veillées
  5: "Formation BAFA/BAFD", // Guide de formation BAFA
  6: "Projets d'animation", // Projet pédagogique de séjour
  7: "Outils de formation", // Théâtre d'improvisation
  8: "Gestion de groupe", // Gestion de conflits
  9: "Activités manuelles et créatives", // Recyclage créatif
  10: "Jeux et activités sportives", // Olympiades
  11: "Environnement et développement durable", // Photographie nature (approfondissement)
  12: "Animer les droits de l'enfant", // Conseil d'enfants (approfondissement)
};

console.log("Attribution des catégories aux ressources...\n");

for (const [id, category] of Object.entries(resourceCategories)) {
  const resourceId = parseInt(id);
  await db
    .update(resources)
    .set({ category })
    .where(eq(resources.id, resourceId));
  
  console.log(`✅ Ressource ${resourceId}: ${category}`);
}

console.log("\n✨ Attribution des catégories terminée !");
