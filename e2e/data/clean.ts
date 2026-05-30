import { config } from 'dotenv';
import { resolve } from 'path';
import { Pool } from 'pg';

config({ path: resolve(__dirname, '../.env.e2e') });

function createPool() {
  return new Pool({
    host: process.env.E2E_DB_HOST ?? 'localhost',
    port: parseInt(process.env.E2E_DB_PORT ?? '5432', 10),
    database: process.env.E2E_DB_NAME ?? 'closet',
    user: process.env.E2E_DB_USER ?? 'closet',
    password: process.env.E2E_DB_PASSWORD ?? 'closet_secret',
  });
}

export async function clean() {
  console.log('[Clean] Removing E2E test data...');

  const pool = createPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      DELETE FROM calendar_events
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e%@test-closet.local' OR email = $1)
    `, [process.env.E2E_TEST_EMAIL ?? 'e2e@test.com']);

    await client.query(`
      DELETE FROM outfit_garments
      WHERE outfit_id IN (SELECT id FROM outfits WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e%@test-closet.local' OR email = $1))
    `, [process.env.E2E_TEST_EMAIL ?? 'e2e@test.com']);

    await client.query(`
      DELETE FROM outfits
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e%@test-closet.local' OR email = $1)
    `, [process.env.E2E_TEST_EMAIL ?? 'e2e@test.com']);

    await client.query(`
      DELETE FROM garments
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE 'e2e%@test-closet.local' OR email = $1)
    `, [process.env.E2E_TEST_EMAIL ?? 'e2e@test.com']);

    await client.query(`
      DELETE FROM users
      WHERE email LIKE 'e2e%@test-closet.local' OR email = $1
    `, [process.env.E2E_TEST_EMAIL ?? 'e2e@test.com']);

    await client.query('COMMIT');
    console.log('[Clean] Test data removed');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Clean] Failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

const isMainModule = process.argv[1]?.endsWith('clean.ts') || process.argv[1]?.endsWith('clean.js');
if (isMainModule) {
  clean().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
