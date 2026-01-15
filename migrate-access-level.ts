import { getDb } from './server/db';
import { sql } from 'drizzle-orm';

async function migrate() {
  const db = await getDb();
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  try {
    // Vérifier si la colonne existe
    const result = await db.execute(sql`DESCRIBE resources`);
    const rows = result as any[];
    const hasAccessLevel = rows.some((r: any) => r.Field === 'accessLevel');
    
    if (!hasAccessLevel) {
      console.log('Adding accessLevel column...');
      await db.execute(sql`ALTER TABLE resources ADD COLUMN accessLevel enum('PUBLIC','AUTHENTICATED','PREMIUM') DEFAULT 'PUBLIC' NOT NULL`);
      console.log('✅ Column added successfully');
    } else {
      console.log('✅ Column already exists');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

migrate();
