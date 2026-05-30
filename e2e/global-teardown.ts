import type { FullConfig } from '@playwright/test';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import { rm } from 'fs/promises';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { clean } from './data/clean';

config({ path: resolve(__dirname, '.env.e2e') });

const IS_CI = process.env.CI === 'true';
const DOCKER_MARKER = resolve(__dirname, '.docker-started');

async function globalTeardown(_config: FullConfig) {
  console.log('[E2E Teardown] Starting cleanup...');

  // 1. Clean database
  console.log('[E2E Teardown] Cleaning test data...');
  try {
    await clean();
  } catch (err) {
    console.warn('[E2E Teardown] DB cleanup failed:', err);
  }

  // 2. Stop Docker stack only if this run started it successfully
  if (!IS_CI && existsSync(DOCKER_MARKER)) {
    console.log('[E2E Teardown] Stopping Docker stack...');
    try {
      execSync(
        `docker compose -f ${process.env.E2E_DOCKER_COMPOSE_FILE ?? '../docker-compose.yml'} -p ${process.env.E2E_DOCKER_PROJECT ?? 'closet-inteligente'} down`,
        { stdio: 'inherit', timeout: 60_000 },
      );
      await rm(DOCKER_MARKER, { force: true });
      console.log('[E2E Teardown] Docker stack stopped');
    } catch (err) {
      console.warn('[E2E Teardown] Docker compose down failed:', err);
    }
  } else if (!IS_CI) {
    console.log('[E2E Teardown] Docker stack was not started by this run — skipping stop');
  }

  console.log('[E2E Teardown] Complete');
}

export default globalTeardown;
