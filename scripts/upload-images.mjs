import { drizzle } from "drizzle-orm/mysql2";
import { resources } from "../drizzle/schema.ts";
import { eq } from "drizzle-orm";
import mysql from "mysql2/promise";
import "dotenv/config";
import { storagePut } from "../server/storage.ts";
import { readFileSync } from "fs";

const IMAGE_MAPPING = {
  "Le jeu du parachute": "/home/ubuntu/ressourcerie-ifac/images/parachute.png",
  "Atelier fabrication de cerf-volant": "/home/ubuntu/ressourcerie-ifac/images/cerf-volant.png",
  "Grand jeu : La quête des éléments": "/home/ubuntu/ressourcerie-ifac/images/quete-elements.png",
  "Répertoire de chants pour veillées": "/home/ubuntu/ressourcerie-ifac/images/chants-veillees.png",
  "Formation BAFA : Connaissance de l'enfant": "/home/ubuntu/ressourcerie-ifac/images/formation-bafa.png",
  "Projet pédagogique : Séjour nature et découverte": "/home/ubuntu/ressourcerie-ifac/images/projet-pedagogique.png",
  "Atelier théâtre d'improvisation": "/home/ubuntu/ressourcerie-ifac/images/theatre-improvisation.png",
  "Gestion des conflits entre enfants": "/home/ubuntu/ressourcerie-ifac/images/gestion-conflits.png",
  "Activités autour du recyclage créatif": "/home/ubuntu/ressourcerie-ifac/images/recyclage-creatif.png",
  "Organisation d'une journée olympiades": "/home/ubuntu/ressourcerie-ifac/images/olympiades.png",
  "Initiation à la photographie nature": "/home/ubuntu/ressourcerie-ifac/images/photographie-nature.png",
  "Conseil d'enfants : mise en place et animation": "/home/ubuntu/ressourcerie-ifac/images/conseil-enfants.png",
};

async function uploadImages() {
  console.log("🚀 Démarrage de l'upload des images vers S3...\n");

  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const db = drizzle(connection);

  let successCount = 0;
  let errorCount = 0;

  for (const [title, imagePath] of Object.entries(IMAGE_MAPPING)) {
    try {
      // Lire le fichier image
      const imageBuffer = readFileSync(imagePath);
      
      // Générer une clé S3 unique
      const fileName = imagePath.split("/").pop();
      const s3Key = `resources/thumbnails/${Date.now()}-${fileName}`;
      
      // Upload vers S3
      console.log(`📤 Upload de l'image pour "${title}"...`);
      const { url } = await storagePut(s3Key, imageBuffer, "image/png");
      
      // Mettre à jour la base de données
      await db
        .update(resources)
        .set({ thumbnailUrl: url })
        .where(eq(resources.title, title));
      
      console.log(`  ✓ Image uploadée et URL mise à jour: ${url}\n`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Erreur pour "${title}":`, error.message, "\n");
      errorCount++;
    }
  }

  await connection.end();

  console.log("\n" + "=".repeat(60));
  console.log(`✅ Upload terminé !`);
  console.log(`   - ${successCount} images uploadées avec succès`);
  if (errorCount > 0) {
    console.log(`   - ${errorCount} erreurs rencontrées`);
  }
  console.log("=".repeat(60));
}

uploadImages().catch((error) => {
  console.error("❌ Erreur fatale:", error);
  process.exit(1);
});
