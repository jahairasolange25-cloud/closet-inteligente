'use strict';

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const poolOpts = process.env.DATABASE_URL
  ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || process.env.POSTGRES_DB || 'closet',
      user: process.env.DB_USER || process.env.POSTGRES_USER || 'closet',
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'closet_secret',
      ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== 'db'
        ? { rejectUnauthorized: false }
        : false,
    };
if (!process.env.DATABASE_URL) {
  poolOpts.family = 4;
}
const pool = new Pool(poolOpts);

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(300) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT filename FROM _migrations ORDER BY filename');
  return new Set(result.rows.map((r) => r.filename));
}

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'src', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    let count = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`  [skip] ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  [run]  ${file}`);

      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        count++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`  [FAIL] ${file}: ${err.message}`);
        process.exit(1);
      }
    }

    console.log(`\nMigrations complete: ${count} applied, ${applied.size} already applied.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error('Migration runner failed:', err.message);
  process.exit(1);
});
