import * as db from './server/db.ts';

async function testAssignCategories() {
  console.log('🚀 Début du test d\'assignation des catégories...');
  
  const typeToCategories = {
    'Fiche': ['Fiches pratiques'],
    'Kit clé en main': ['Kits complets'],
    'Projet': ['Projets pédagogiques'],
    'Article': ['Articles'],
    'Grand jeu': ['Grands jeux'],
    'Atelier': ['Ateliers'],
    'Recette': ['Recettes'],
    'Activité': ['Activités'],
  };

  const resources = await db.getAllResources();
  console.log(`📊 Total de ressources: ${resources.length}`);
  
  let updated = 0;
  let skipped = 0;

  for (const resource of resources) {
    try {
      let isValidJSON = false;
      
      if (resource.category) {
        try {
          JSON.parse(resource.category);
          isValidJSON = true;
        } catch (e) {
          isValidJSON = false;
        }
      }
      
      if (isValidJSON) {
        skipped++;
        continue;
      }

      const newCategories = typeToCategories[resource.type] || ['Autres'];
      await db.updateResourceCategories(resource.id, newCategories);
      console.log(`✅ Ressource ${resource.id} (${resource.type}) -> ${newCategories.join(', ')}`);
      updated++;
    } catch (error) {
      console.error(`❌ Erreur pour la ressource ${resource.id}:`, error);
    }
  }

  console.log(`\n📈 Résultats:`);
  console.log(`   Mises à jour: ${updated}`);
  console.log(`   Ignorées: ${skipped}`);
  console.log(`   Total: ${updated + skipped}`);
}

testAssignCategories().catch(err => {
  console.error('Erreur:', err);
  process.exit(1);
});
