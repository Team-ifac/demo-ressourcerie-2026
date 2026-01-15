import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as fs from "fs";

// Configuration S3
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const bucketName = process.env.S3_BUCKET || "manus-storage";
const prefix = "ressourcerie-ifac/"; // Préfixe des fichiers du projet

async function listS3Images() {
  try {
    console.log(`📸 Récupération des images depuis S3 (bucket: ${bucketName})...\n`);

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix,
    });

    const response = await s3Client.send(command);
    const contents = response.Contents || [];

    // Filtrer les images (PNG, JPG, JPEG, WEBP, GIF)
    const images = contents.filter((obj) => {
      const key = obj.Key;
      return /\.(png|jpg|jpeg|webp|gif)$/i.test(key);
    });

    console.log(`✅ Trouvé ${images.length} images sur S3\n`);

    // Créer un fichier CSV avec les URLs
    const csvContent = [
      ["Nom du fichier", "URL S3", "Taille (KB)", "Date de création"],
      ...images.map((img) => [
        img.Key.replace(prefix, ""),
        `https://${bucketName}.s3.amazonaws.com/${img.Key}`,
        (img.Size / 1024).toFixed(2),
        new Date(img.LastModified).toLocaleString("fr-FR"),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    fs.writeFileSync("s3-images-list.csv", csvContent);
    console.log("📋 Fichier CSV créé : s3-images-list.csv\n");

    // Afficher les images
    console.log("🖼️  Images trouvées :\n");
    images.forEach((img, index) => {
      const fileName = img.Key.replace(prefix, "");
      const sizeKB = (img.Size / 1024).toFixed(2);
      console.log(`${index + 1}. ${fileName} (${sizeKB} KB)`);
      console.log(
        `   URL: https://${bucketName}.s3.amazonaws.com/${img.Key}\n`
      );
    });

    console.log(`\n✅ Total : ${images.length} images`);
    console.log("📥 Téléchargez le fichier s3-images-list.csv pour avoir la liste complète");
  } catch (error) {
    console.error("❌ Erreur :", error.message);
  }
}

listS3Images();
