import { test, expect } from './fixtures/auth.fixture';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';

test.describe('Logout + Token Blacklist', () => {
  test('logout invalidates access token via Redis blacklist', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    // Confirm token works before logout
    const beforeRes = await page.request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(beforeRes.ok()).toBeTruthy();

    // Logout — token should be blacklisted
    const logoutRes = await page.request.post(`${API_URL}/auth/logout`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.ok()).toBeTruthy();

    // Blacklisted token must be rejected
    const afterRes = await page.request.get(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(afterRes.status()).toBe(401);
  });

  test('logout via UI clears localStorage and redirects to login', async ({ page, testUser }) => {
    // Inject tokens and navigate to app
    await page.goto('/');
    await page.evaluate(
      ([access, refresh]: string[]) => {
        localStorage.setItem('closet_access_token', access);
        localStorage.setItem('closet_refresh_token', refresh);
      },
      [testUser.accessToken ?? '', testUser.refreshToken ?? ''],
    );

    await page.goto('/');
    // Find logout button — may be in nav menu or profile dropdown
    const logoutBtn = page
      .getByRole('button', { name: /logout|cerrar sesión|salir/i })
      .or(page.getByTestId('logout-button'));

    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    } else {
      // May need to open user menu first
      const userMenu = page.getByTestId('user-menu').or(page.locator('[aria-label*="user"], [aria-label*="profile"]'));
      if (await userMenu.isVisible()) {
        await userMenu.click();
        await page.getByRole('menuitem', { name: /logout|cerrar/i }).click();
      }
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 8_000 });

    const accessToken = await page.evaluate(() => localStorage.getItem('closet_access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('closet_refresh_token'));
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  test('blacklisted token cannot access protected endpoints', async ({ page, testUser }) => {
    // Logout to blacklist
    await page.request.post(`${API_URL}/auth/logout`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
    });

    // Try several protected endpoints
    const endpoints = ['/auth/me', '/garments', '/outfits', '/calendar'];
    for (const ep of endpoints) {
      const res = await page.request.get(`${API_URL}${ep}`, {
        headers: { Authorization: `Bearer ${testUser.accessToken}` },
      });
      expect(res.status(), `${ep} should return 401`).toBe(401);
    }
  });
});
