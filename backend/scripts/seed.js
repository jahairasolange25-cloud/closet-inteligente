'use strict';

const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'closet',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'closet',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'closet_secret',
});

async function run() {
  const client = await pool.connect();

  try {
    console.log('Seeding test users...\n');

    const testUsers = [
      {
        email: 'admin@closet.com',
        password: 'admin',
        full_name: 'Admin',
      },
    ];

    for (const user of testUsers) {
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL',
        [user.email],
      );

      if (existing.rows.length > 0) {
        console.log(`  [skip] ${user.email} — already exists`);
        continue;
      }

      const password_hash = await bcrypt.hash(user.password, 12);
      await client.query(
        `INSERT INTO users (email, password_hash, full_name)
         VALUES ($1, $2, $3)`,
        [user.email, password_hash, user.full_name],
      );

      console.log(`  [ok]   ${user.email} / ${user.password}`);
    }

    console.log('\nSeed complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
