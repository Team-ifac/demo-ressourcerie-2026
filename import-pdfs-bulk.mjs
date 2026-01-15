import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fonction pour créer un fichier JSON avec les ressources à importer
async function generateImportJSON() {
  const baseDir = '/home/ubuntu/upload/Ressourcerie ifac';
  
  // Dossier 1: Techniques d'animation (tous les profils)
  const techniquesDir = path.join(baseDir, 'Techniques d_animation');
  const techniquesFiles = getAllPDFs(techniquesDir);
  
  // Dossier 2: Pour formateurs seulement (formateurs uniquement)
  const formateurDir = path.join(baseDir, 'Pour formateurs seulement');
  const formateurFiles = getAllPDFs(formateurDir);
  
  // Créer les ressources pour import
  const resources = [];
  
  // Ajouter les ressources de Techniques d'animation
  techniquesFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    const title = fileName.replace('.pdf', '');
    
    resources.push({
      title,
      summary: `Ressource pédagogique: ${title}`,
      content: `Fichier PDF: ${fileName}`,
      type: 'Fiche',
      visibility: 'PUBLIC',
      accessLevel: 'AUTHENTICATED',
      status: 'approved',
      profiles: ['animateur', 'formateur', 'directeur', 'stagiaire_bafa'],
      fileUrl: filePath,
      fileName,
      folder: 'Techniques d\'animation'
    });
  });
  
  // Ajouter les ressources de Pour formateurs seulement
  formateurFiles.forEach((filePath, index) => {
    const fileName = path.basename(filePath);
    const title = fileName.replace('.pdf', '');
    
    resources.push({
      title,
      summary: `Ressource pour formateurs: ${title}`,
      content: `Fichier PDF: ${fileName}`,
      type: 'Fiche',
      visibility: 'PUBLIC',
      accessLevel: 'PREMIUM',
      status: 'approved',
      profiles: ['formateur'],
      fileUrl: filePath,
      fileName,
      folder: 'Pour formateurs seulement'
    });
  });
  
  // Sauvegarder le JSON
  const outputPath = '/home/ubuntu/ressourcerie-ifac/import-resources.json';
  fs.writeFileSync(outputPath, JSON.stringify(resources, null, 2));
  
  console.log(`✅ Fichier d'import généré: ${outputPath}`);
  console.log(`📊 Ressources à importer: ${resources.length}`);
  console.log(`   - Techniques d'animation: ${techniquesFiles.length}`);
  console.log(`   - Pour formateurs seulement: ${formateurFiles.length}`);
  
  return resources;
}

function getAllPDFs(dir) {
  let files = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.toLowerCase().endsWith('.pdf')) {
        files.push(fullPath);
      }
    });
  }
  
  walkDir(dir);
  return files;
}

generateImportJSON().catch(console.error);
