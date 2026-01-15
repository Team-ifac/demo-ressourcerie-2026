import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'ressourcerie',
});

try {
  const [rows] = await connection.execute('SELECT COUNT(*) as count FROM resources');
  console.log('✅ Nombre total de ressources:', rows[0].count);
  
  const [recent] = await connection.execute('SELECT id, title, createdAt FROM resources ORDER BY createdAt DESC LIMIT 5');
  console.log('\n📄 5 dernières ressources:');
  recent.forEach(r => {
    console.log(`  - ${r.title} (ID: ${r.id})`);
  });
} catch (error) {
  console.error('❌ Erreur:', error.message);
} finally {
  await connection.end();
}
