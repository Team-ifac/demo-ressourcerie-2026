import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ressourcerie',
});

// Mapping des types de ressources aux catégories
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

// Récupérer toutes les ressources
const [resources] = await connection.query('SELECT id, type, category FROM resources');

console.log(`📊 Total de ressources: ${resources.length}`);

let updated = 0;
let skipped = 0;

for (const resource of resources) {
  try {
    const currentCategories = resource.category ? JSON.parse(resource.category) : [];
    
    // Si la ressource a déjà des catégories, on la saute
    if (currentCategories.length > 0) {
      skipped++;
      continue;
    }

    // Déterminer les catégories basées sur le type
    let newCategories = typeToCategories[resource.type] || ['Autres'];
    
    // Mettre à jour la ressource
    await connection.query(
      'UPDATE resources SET category = ? WHERE id = ?',
      [JSON.stringify(newCategories), resource.id]
    );
    
    updated++;
    console.log(`✅ Ressource ${resource.id}: ${resource.type} → ${newCategories.join(', ')}`);
  } catch (error) {
    console.error(`❌ Erreur pour la ressource ${resource.id}:`, error.message);
  }
}

console.log(`\n📈 Résumé:`);
console.log(`   - Mises à jour: ${updated}`);
console.log(`   - Ignorées (déjà catégorisées): ${skipped}`);
console.log(`   - Total traité: ${updated + skipped}`);

await connection.end();
console.log(`\n✅ Script terminé!`);
