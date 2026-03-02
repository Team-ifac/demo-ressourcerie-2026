import mysql from "mysql2/promise";

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function columnExists() {
  const [rows] = await conn.query("DESCRIBE resources");
  return rows.some((r) => r.Field === "accessLevel");
}

try {
  const hasAccessLevel = await columnExists();

  if (!hasAccessLevel) {
    console.log("Adding accessLevel column...");
    await conn.query(
      "ALTER TABLE resources ADD COLUMN accessLevel enum('PUBLIC','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'"
    );
    console.log("✅ Column added successfully");
  } else {
    console.log("✅ Column already exists -> ensuring enum is up-to-date...");

    // 1) Étendre temporairement pour permettre la migration si d’anciennes valeurs existent
    await conn.query(
      "ALTER TABLE resources MODIFY COLUMN accessLevel enum('PUBLIC','AUTHENTICATED','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'"
    );

    // 2) Migrer AUTHENTICATED -> INTERNAL_IFAC
    const [res] = await conn.query(
      "UPDATE resources SET accessLevel='INTERNAL_IFAC' WHERE accessLevel='AUTHENTICATED'"
    );
    console.log("✅ Migrated AUTHENTICATED -> INTERNAL_IFAC");

    // 3) Re-figer l’enum final
    await conn.query(
      "ALTER TABLE resources MODIFY COLUMN accessLevel enum('PUBLIC','INTERNAL_IFAC','PREMIUM') NOT NULL DEFAULT 'PUBLIC'"
    );

    console.log("✅ Enum normalized to (PUBLIC, INTERNAL_IFAC, PREMIUM)");
  }
} catch (error) {
  console.error("Error:", error?.message ?? error);
} finally {
  await conn.end();
}
