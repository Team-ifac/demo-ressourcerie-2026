import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fonction pour extraire les PDFs et créer les ressources
async function importPDFs() {
  const baseDir = '/home/ubuntu/upload/Ressourcerie ifac';
  
  // Dossier 1: Techniques d'animation (tous les profils)
  const techniquesDir = path.join(baseDir, 'Techniques d_animation');
  const techniquesFiles = getAllPDFs(techniquesDir);
  
  // Dossier 2: Pour formateurs seulement (formateurs uniquement)
  const formateurDir = path.join(baseDir, 'Pour formateurs seulement');
  const formateurFiles = getAllPDFs(formateurDir);
  
  console.log(`📊 Statistiques d'import:`);
  console.log(`   - Techniques d'animation: ${techniquesFiles.length} PDFs`);
  console.log(`   - Pour formateurs seulement: ${formateurFiles.length} PDFs`);
  console.log(`   - Total: ${techniquesFiles.length + formateurFiles.length} PDFs\n`);
  
  // Afficher les premiers fichiers
  console.log('📄 Exemples de fichiers:');
  techniquesFiles.slice(0, 3).forEach(f => {
    console.log(`   - Techniques: ${path.basename(f)}`);
  });
  formateurFiles.slice(0, 3).forEach(f => {
    console.log(`   - Formateurs: ${path.basename(f)}`);
  });
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

importPDFs().catch(console.error);
