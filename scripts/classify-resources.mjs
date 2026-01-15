import { db } from '../server/db.ts';
import { findBestCollection } from '../server/collectionMatcher.ts';

async function classifyResources() {
  console.log('🚀 Début de la classification des ressources...\n');

  try {
    // Récupérer toutes les ressources
    const allResources = await db.getAllResources();
    const publicCollections = await db.getPublicCollections();

    let classified = 0;
    let skipped = 0;
    const results = [];

    for (const resource of allResources) {
      // Vérifier si la ressource est déjà associée
      const existingCollections = await db.getCollectionsByResourceId(resource.id);
      if (existingCollections.length > 0) {
        skipped++;
        continue;
      }

      // Récupérer les tags
      const tags = await db.getResourceTags(resource.id);

      // Trouver la meilleure collection
      const bestCollection = findBestCollection(resource, tags, 30);

      if (bestCollection) {
        const collection = publicCollections.find(c => c.name === bestCollection.name);
        if (collection) {
          // Ajouter la ressource à la collection
          await db.addResourceToCollection(collection.id, resource.id);
          classified++;
          results.push({
            resourceId: resource.id,
            resourceTitle: resource.title,
            collectionName: bestCollection.name,
            score: bestCollection.score,
          });
          console.log(`✅ "${resource.title}" → "${bestCollection.name}" (score: ${bestCollection.score})`);
        }
      }
    }

    console.log(`\n📊 Résultats:`);
    console.log(`   ✅ Classées: ${classified}`);
    console.log(`   ⏭️  Déjà classées: ${skipped}`);
    console.log(`   📈 Total: ${classified + skipped}/${allResources.length}`);

    // Afficher les collections et leurs compteurs
    console.log(`\n📚 Compteurs par collection:`);
    for (const collection of publicCollections) {
      const count = results.filter(r => r.collectionName === collection.name).length;
      console.log(`   ${collection.name}: ${count} ressources`);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }

  process.exit(0);
}

classifyResources();
