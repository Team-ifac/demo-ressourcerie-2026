import { getDb } from "../server/db.ts";
import { resources } from "../drizzle/schema.ts";

const db = await getDb();
if (!db) {
  console.error("Database not available");
  process.exit(1);
}

const allResources = await db.select({ 
  id: resources.id, 
  title: resources.title, 
  category: resources.category 
}).from(resources);

console.log("📋 Ressources et leurs catégories :\n");
allResources.forEach(r => {
  console.log(`${r.id}. ${r.title}`);
  console.log(`   Catégorie: ${r.category || '❌ AUCUNE'}\n`);
});
