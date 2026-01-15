import mysql from 'mysql2/promise';
import { hash } from 'argon2';

const connection = await mysql.createConnection({
  uri: process.env.DATABASE_URL,
  ssl: 'amazon',
});

const testAccounts = [
  {
    firstName: 'Sophie',
    lastName: 'Martin',
    email: 'sophie.martin@test.com',
    password: 'TestSophie123!',
    profileType: 'formateur',
  },
  {
    firstName: 'Marc',
    lastName: 'Durand',
    email: 'marc.durand@test.com',
    password: 'TestMarc123!',
    profileType: 'animateur',
  },
  {
    firstName: 'Claire',
    lastName: 'Leclerc',
    email: 'claire.leclerc@test.com',
    password: 'TestClaire123!',
    profileType: 'directeur',
  },
  {
    firstName: 'Thomas',
    lastName: 'Bernard',
    email: 'thomas.bernard@test.com',
    password: 'TestThomas123!',
    profileType: 'stagiaire_bafa',
  },
];

for (const account of testAccounts) {
  const passwordHash = await hash(account.password);
  const openId = `test-${account.profileType}-${Date.now()}`;
  
  try {
    await connection.execute(
      `INSERT INTO users (firstName, lastName, email, passwordHash, emailVerified, profileType, loginMethod, openId) 
       VALUES (?, ?, ?, ?, 1, ?, 'email', ?)`,
      [account.firstName, account.lastName, account.email, passwordHash, account.profileType, openId]
    );
    console.log(`✅ Créé: ${account.firstName} ${account.lastName} (${account.profileType})`);
  } catch (error) {
    console.error(`❌ Erreur pour ${account.email}:`, error.message);
  }
}

await connection.end();
console.log('\n✅ Tous les comptes de test ont été créés !');
