import { getDb } from "./server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  const db = await getDb();
  if (!db) {
    console.error("Database not available");
    process.exit(1);
  }

  try {
    // Vérifier si la colonne existe
    const result = await db.execute(sql`DESCRIBE resources`);
    const rows = result as any[];
    const hasAccessLevel = rows.some((r: any) => r.Field === "accessLevel");

    if (!hasAccessLevel) {
      console.log("Adding accessLevel column...");
      await db.execute(
        sql`ALTER TABLE resources ADD COLUMN accessLevel enum('PUBLIC','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'`
      );
      console.log("✅ Column added successfully");
    } else {
      console.log("✅ Column already exists -> ensuring enum is up-to-date...");

      // 1) Étendre temporairement l’enum pour permettre la migration
      await db.execute(
        sql`ALTER TABLE resources MODIFY COLUMN accessLevel enum('PUBLIC','AUTHENTICATED','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'`
      );

      // 2) Migrer AUTHENTICATED -> INTERNAL_IFAC
      await db.execute(
        sql`UPDATE resources SET accessLevel='INTERNAL_IFAC' WHERE accessLevel='AUTHENTICATED'`
      );
      console.log("✅ Migrated AUTHENTICATED -> INTERNAL_IFAC");

      // 3) Re-figer l’enum final
      await db.execute(
        sql`ALTER TABLE resources MODIFY COLUMN accessLevel enum('PUBLIC','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'`
      );

      console.log("✅ Enum normalized to (PUBLIC, INTERNAL_IFAC, PREMIUM)");
    }

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

migrate();
