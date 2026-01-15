import { getDb } from "../server/db.ts";
import { resources } from "../drizzle/schema.ts";

const db = await getDb();
if (!db) {
  console.error("Database not available");
  process.exit(1);
}

const allResources = await db.select().from(resources);
console.log(JSON.stringify(allResources, null, 2));
