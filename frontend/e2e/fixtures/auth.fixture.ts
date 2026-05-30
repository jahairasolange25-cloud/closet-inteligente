import { test as base, expect, type Page, type BrowserContext } from '@playwright/test';
import { registerAndLogin, deleteTestUser, makeTestUser, type TestUser } from './test-users.factory';

const ACCESS_KEY = 'closet_access_token';
const REFRESH_KEY = 'closet_refresh_token';

export type AuthFixtures = {
  authenticatedPage: Page;
  testUser: TestUser;
  authContext: BrowserContext;
};

async function injectTokens(page: Page, user: TestUser): Promise<void> {
  await page.goto('/');
  await page.evaluate(
    ([access, refresh, aKey, rKey]: [string, string, string, string]) => {
      localStorage.setItem(aKey, access);
      localStorage.setItem(rKey, refresh);
    },
    [user.accessToken ?? '', user.refreshToken ?? '', ACCESS_KEY, REFRESH_KEY] as [string, string, string, string],
  );
}

export const test = base.extend<AuthFixtures>({
  testUser: async ({}, use) => {
    const user = makeTestUser();
    const loggedIn = await registerAndLogin(user);
    await use(loggedIn);
    await deleteTestUser(loggedIn);
  },

  authenticatedPage: async ({ page, testUser }, use) => {
    await injectTokens(page, testUser);
    await page.goto('/');
    await use(page);
  },

  authContext: async ({ browser, testUser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await injectTokens(page, testUser);
    await page.close();
    await use(context);
    await context.close();
  },
});

export { expect };

export async function waitForAuth(page: Page): Promise<void> {
  await expect(page.locator('[data-testid="user-menu"], [data-testid="dashboard-header"], nav')).toBeVisible({
    timeout: 10_000,
  });
}

export async function loginViaUI(page: Page, email: string, password: string): Promise<void> {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/^contraseña\*?$/i).fill(password);
  await page.getByRole('button', { name: /iniciar sesión|login|sign in/i }).click();
}
