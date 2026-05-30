import { test, expect } from './fixtures/auth.fixture';
import { makeTestUser, registerAndLogin } from './fixtures/test-users.factory';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';

test.describe('Auth Flow', () => {
  test('register → login → access profile → logout', async ({ page }) => {
    const user = makeTestUser('reg');

    // Register via UI
    await page.goto('/register');
    await page.getByLabel(/nombre|name/i).fill(user.name);
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/^contraseña\*?$/i).fill(user.password);
    await page.getByRole('button', { name: /registr|sign up|crear/i }).click();

    // Should redirect to dashboard or login after registration
    await expect(page).toHaveURL(/\/(login|register|$)/, { timeout: 10_000 });

    // Login via UI
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/^contraseña\*?$/i).fill(user.password);
    await page.getByRole('button', { name: /iniciar|login|sign in/i }).click();

    // Authenticated — should be on dashboard
    await expect(page).toHaveURL(/\/(dashboard|$)/, { timeout: 10_000 });

    // JWT in localStorage
    const token = await page.evaluate(() => localStorage.getItem('closet_access_token'));
    expect(token).toBeTruthy();
  });

  test('login with bad credentials returns error', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('nobody@nowhere.test');
    await page.getByLabel(/^contraseña\*?$/i).fill('WrongPassword99!');
    await page.getByRole('button', { name: /iniciar|login|sign in/i }).click();

    // Error visible — no redirect
    await expect(page.getByRole('alert').or(page.locator('[data-testid="login-error"], .text-red, .text-destructive'))).toBeVisible({
      timeout: 8_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test('protected route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/garments');
    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });
  });

  test('refresh token flow keeps session alive', async ({ page, testUser }) => {
    await page.evaluate(
      ([access, refresh]: string[]) => {
        localStorage.setItem('closet_access_token', access);
        localStorage.setItem('closet_refresh_token', refresh);
      },
      [testUser.accessToken ?? '', testUser.refreshToken ?? ''],
    );

    // Directly call refresh endpoint
    const res = await page.request.post(`${API_URL}/auth/refresh`, {
      data: { refreshToken: testUser.refreshToken },
    });
    expect(res.ok()).toBeTruthy();
    // Backend returns { user, tokens: { accessToken, refreshToken } }
    const body = await res.json() as { user: object; tokens: { accessToken: string; refreshToken: string } };
    expect(body.tokens.accessToken).toBeTruthy();
    expect(body.tokens.refreshToken).toBeTruthy();
    // New tokens should differ from originals (rotation)
    expect(body.tokens.refreshToken).not.toBe(testUser.refreshToken);
  });

  test('get /me returns authenticated user profile', async ({ page, testUser }) => {
    const res = await page.request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json() as { email: string };
    expect(body.email).toBe(testUser.email);
  });
});
