import type { FullConfig } from '@playwright/test';
import { config } from 'dotenv';
import { rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { clean } from './data/clean';
import { seed } from './data/seed';
import { waitForServer, waitForDatabase } from './utils/server';

config({ path: resolve(__dirname, '.env.e2e') });

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:3000';
const API_URL = process.env.E2E_API_URL ?? 'http://localhost:4000';
const IS_CI = process.env.CI === 'true';
const DOCKER_MARKER = resolve(__dirname, '.docker-started');

async function globalSetup(_config: FullConfig) {
  console.log(`[E2E Setup] Base URL: ${BASE_URL}`);
  console.log(`[E2E Setup] API URL: ${API_URL}`);
  console.log(`[E2E Setup] CI mode: ${IS_CI}`);

  // 1. Start Docker stack if not in CI
  await rm(DOCKER_MARKER, { force: true });
  if (!IS_CI) {
    console.log('[E2E Setup] Starting Docker stack...');
    try {
      const { execSync } = await import('child_process');
      execSync(
        `docker compose -f ${process.env.E2E_DOCKER_COMPOSE_FILE ?? '../docker-compose.yml'} -p ${process.env.E2E_DOCKER_PROJECT ?? 'closet-inteligente'} up -d --wait`,
        { stdio: 'inherit', timeout: 120_000 },
      );
      await writeFile(DOCKER_MARKER, new Date().toISOString(), 'utf-8');
      console.log('[E2E Setup] Docker stack is up');
    } catch (err) {
      console.warn('[E2E Setup] Docker compose failed — assuming stack is already running');
    }
  }

  // 2. Wait for backend health
  console.log('[E2E Setup] Waiting for backend...');
  const backendOk = await waitForServer(`${API_URL}/health`, 60_000);
  if (!backendOk) {
    throw new Error('Backend did not become healthy within 60s');
  }

  // 3. Wait for database connectivity
  console.log('[E2E Setup] Waiting for database...');
  const dbOk = await waitForDatabase(30_000);
  if (!dbOk) {
    throw new Error('Database did not become ready within 30s');
  }

  // 4. Clean stale E2E data before seeding to avoid cross-run coupling.
  if (process.env.E2E_SKIP_PRE_CLEAN !== 'true') {
    console.log('[E2E Setup] Cleaning stale E2E data...');
    await clean();
  }

  // 5. Run seed
  console.log('[E2E Setup] Seeding test data...');
  await seed();

  console.log('[E2E Setup] Complete');
}

export default globalSetup;
