import mysql from "mysql2/promise";
import * as fs from "fs";

async function exportImageUrls() {
  try {
    console.log("📸 Connexion à la base de données...\n");

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "ressourcerie_ifac",
    });

    // Récupérer toutes les ressources avec leurs images
    const [resources] = await connection.execute(
      `SELECT 
        id, 
        title, 
        thumbnailUrl, 
        description,
        type,
        category,
        createdAt
      FROM resources 
      WHERE thumbnailUrl IS NOT NULL 
      AND thumbnailUrl != '' 
      ORDER BY createdAt DESC`
    );

    console.log(`✅ Trouvé ${resources.length} ressources avec des images\n`);

    if (resources.length === 0) {
      console.log("❌ Aucune ressource avec image trouvée");
      await connection.end();
      return;
    }

    // Créer un fichier CSV
    const csvContent = [
      ["ID", "Titre", "URL S3", "Type", "Catégorie", "Description", "Date de création"],
      ...resources.map((r) => [
        r.id,
        r.title,
        r.thumbnailUrl,
        r.type || "",
        r.category || "",
        (r.description || "").substring(0, 100).replace(/"/g, '""'),
        new Date(r.createdAt).toLocaleString("fr-FR"),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    fs.writeFileSync("/home/ubuntu/image-urls-export.csv", csvContent);

    console.log("🖼️  Images trouvées :\n");
    resources.slice(0, 10).forEach((resource, index) => {
      console.log(`${index + 1}. ${resource.title}`);
      console.log(`   URL: ${resource.thumbnailUrl}`);
      console.log(`   Type: ${resource.type}\n`);
    });

    if (resources.length > 10) {
      console.log(`... et ${resources.length - 10} autres ressources\n`);
    }

    console.log(`✅ Total : ${resources.length} images exportées`);
    console.log("📥 Fichier créé : /home/ubuntu/image-urls-export.csv");

    await connection.end();
  } catch (error) {
    console.error("❌ Erreur :", error.message);
  }
}

exportImageUrls();
