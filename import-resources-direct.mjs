import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Importer les fonctions de base de données
import { getDb, createResource, addResourceProfile } from './server/db.ts';

async function importResources() {
  console.log('📊 Démarrage de l\'import des ressources...\n');

  // Charger le fichier JSON
  const resourcesPath = path.join(__dirname, 'import-resources.json');
  const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf-8'));

  console.log(`📄 ${resourcesData.length} ressources à importer\n`);

  // Vérifier que la base de données est disponible
  const db = await getDb();
  if (!db) {
    console.error('❌ Erreur: Base de données non disponible');
    process.exit(1);
  }

  let imported = 0;
  let failed = 0;
  const errors = [];

  // Importer chaque ressource
  for (let i = 0; i < resourcesData.length; i++) {
    const resource = resourcesData[i];
    try {
      // Créer la ressource
      const resourceId = await createResource({
        title: resource.title,
        summary: resource.summary,
        content: resource.content,
        type: resource.type,
        visibility: resource.visibility,
        accessLevel: resource.accessLevel,
        status: resource.status,
        fileUrl: null,
        thumbnailUrl: null,
        category: JSON.stringify([resource.folder]),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, []);

      // Ajouter les profils
      for (const profile of resource.profiles) {
        await addResourceProfile(resourceId, profile);
      }

      imported++;
      console.log(`✅ [${i + 1}/${resourcesData.length}] ${resource.title}`);
    } catch (error) {
      failed++;
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      errors.push(`${resource.fileName}: ${errorMsg}`);
      console.log(`❌ [${i + 1}/${resourcesData.length}] ${resource.title} - ${errorMsg}`);
    }
  }

  console.log('\n📊 Résumé de l\'import:');
  console.log(`✅ Importées: ${imported}`);
  console.log(`❌ Échouées: ${failed}`);
  console.log(`📈 Total: ${resourcesData.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️ Erreurs:');
    errors.forEach(err => console.log(`  - ${err}`));
  }

  process.exit(0);
}

importResources().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
