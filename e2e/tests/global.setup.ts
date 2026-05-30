import { test as setup } from '@playwright/test';
import { mkdir } from 'fs/promises';
import { apiRegister } from '../utils/api';
import { applyAuthState } from '../utils/auth-state';
import { TEST_PASSWORD, uniqueEmail, uniqueName } from '../utils/fixtures';

/**
 * Auth bootstrap fixture — saves authenticated browser state.
 * Runs as a dependency project before all other test projects.
 * Uses browser login flow for realistic auth state (cookies + localStorage).
 */

setup('authenticate', async ({ page, request }) => {
  const auth = await apiRegister(request, {
    name: uniqueName('E2E Setup User'),
    email: uniqueEmail('setup'),
    password: process.env.E2E_TEST_PASSWORD ?? TEST_PASSWORD,
  });

  await applyAuthState(page, auth);
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await mkdir('playwright/.auth', { recursive: true });
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
