import mysql from "mysql2/promise";

async function getImageUrls() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "ressourcerie_ifac",
    });

    console.log("📸 Récupération des URLs des images depuis la base de données...\n");

    // Récupérer toutes les ressources avec leurs images
    const [resources] = await connection.execute(
      "SELECT id, title, thumbnailUrl FROM resources WHERE thumbnailUrl IS NOT NULL AND thumbnailUrl != '' LIMIT 100"
    );

    console.log(`✅ Trouvé ${resources.length} ressources avec des images\n`);

    if (resources.length === 0) {
      console.log("❌ Aucune ressource avec image trouvée dans la base de données");
      console.log("(Les ressources ont probablement été supprimées)");
    } else {
      console.log("🖼️  Images trouvées :\n");
      resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.title}`);
        console.log(`   URL: ${resource.thumbnailUrl}\n`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error("❌ Erreur de connexion :", error.message);
  }
}

getImageUrls();
