import { getAllResources } from "../server/db.ts";

console.log("🧪 Test du filtrage par catégorie\n");

console.log("1️⃣ Test SANS filtre de catégorie:");
const allResources = await getAllResources({ includeInternal: true });
console.log(`   Résultat: ${allResources.length} ressources\n`);

console.log("2️⃣ Test AVEC filtre 'Jeux et activités sportives':");
const filtered = await getAllResources({ 
  category: "Jeux et activités sportives",
  includeInternal: true 
});
console.log(`   Résultat: ${filtered.length} ressources`);
filtered.forEach(r => {
  console.log(`   - ${r.title} (catégorie: ${r.category})`);
});

console.log("\n3️⃣ Test AVEC filtre 'Activités manuelles et créatives':");
const filtered2 = await getAllResources({ 
  category: "Activités manuelles et créatives",
  includeInternal: true 
});
console.log(`   Résultat: ${filtered2.length} ressources`);
filtered2.forEach(r => {
  console.log(`   - ${r.title} (catégorie: ${r.category})`);
});
