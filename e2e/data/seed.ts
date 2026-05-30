import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.e2e') });

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';
const CSRF_TOKEN = process.env.E2E_CSRF_TOKEN ?? 'e2e-csrf-token';

export async function seed() {
  const email = process.env.E2E_TEST_EMAIL ?? 'e2e@test.com';
  const password = process.env.E2E_TEST_PASSWORD ?? 'Test1234!';
  const name = process.env.E2E_TEST_NAME ?? 'E2E Tester';

  console.log(`[Seed] Creating test user: ${email}`);

  try {
    const res = await fetch(`${API_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': CSRF_TOKEN,
        Cookie: `csrf-token=${CSRF_TOKEN}`,
      },
      body: JSON.stringify({
        name,
        email,
        password,
        acceptTerms: true,
        consentAI: true,
      }),
    });

    if (res.ok) {
      console.log('[Seed] Test user created');
    } else if (res.status === 409) {
      console.log('[Seed] Test user already exists — skipping');
    } else {
      console.warn(`[Seed] Register returned ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('[Seed] Failed to create test user:', err);
    throw err;
  }

  console.log('[Seed] Complete');
}

// Run standalone
const isMainModule = process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js');
if (isMainModule) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
