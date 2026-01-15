import mysql from 'mysql2/promise';

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

try {
  const [rows] = await conn.query("DESCRIBE resources");
  const hasAccessLevel = rows.some(r => r.Field === 'accessLevel');
  
  if (!hasAccessLevel) {
    console.log('Adding accessLevel column...');
    await conn.query("ALTER TABLE resources ADD COLUMN accessLevel enum('PUBLIC','AUTHENTICATED','PREMIUM') DEFAULT 'PUBLIC' NOT NULL");
    console.log('✅ Column added successfully');
  } else {
    console.log('✅ Column already exists');
  }
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await conn.end();
}
