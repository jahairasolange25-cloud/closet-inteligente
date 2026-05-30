import { test, expect } from '../fixtures/base';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ProfilePage } from '../pages/ProfilePage';
import { uniqueEmail, uniqueName, TEST_PASSWORD } from '../utils/fixtures';
import { apiRegister, apiRefreshToken, apiLogin, csrfHeaders } from '../utils/api';
import { applyAuthState } from '../utils/auth-state';
import { API_URL } from '../playwright.config';

test.describe('FLOW 1: Authentication', () => {
  test.describe('Registration', () => {
    test('should register a new user successfully', async ({ page, context }) => {
      // Clear auth state to test registration fresh
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await expect(registerPage.heading).toBeVisible();

      await registerPage.register({
        name: uniqueName(),
        email: uniqueEmail(),
        password: TEST_PASSWORD,
        acceptTerms: true,
        consentAI: true,
      });

      await page.waitForURL(/^\/$/, { timeout: 15_000 });
      const dashboard = new DashboardPage(page);
      await expect(dashboard.heading).toBeVisible();
    });

    test('should show validation errors for empty fields', async ({ page, context }) => {
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.submitButton.click();
      await page.waitForTimeout(500);

      const alerts = await page.getByRole('alert').count();
      expect(alerts).toBeGreaterThanOrEqual(1);
    });

    test('should reject duplicate email', async ({ page, context, request }) => {
      const email = uniqueEmail();
      const name = uniqueName();

      await apiRegister(request, { name, email, password: TEST_PASSWORD });

      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      const registerPage = new RegisterPage(page);
      await registerPage.goto();
      await registerPage.register({
        name: uniqueName(),
        email,
        password: TEST_PASSWORD,
        acceptTerms: true,
      });

      const error = await registerPage.waitForError();
      await expect(error).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test('should login with valid credentials', async ({ page, context }) => {
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());

      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await expect(loginPage.heading).toBeVisible();

      // Register a user via API first, then login via UI
      const email = uniqueEmail();
      const name = uniqueName();
      await apiRegister(page.request, { name, email, password: TEST_PASSWORD });

      await page.goto('/login');
      await page.waitForLoadState('networkidle');

      await loginPage.login(email, TEST_PASSWORD);
      await loginPage.isLoggedIn();

      const dashboard = new DashboardPage(page);
      await expect(dashboard.heading).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page, context }) => {
      const loginPage = new LoginPage(page);
      await context.clearCookies();
      await page.evaluate(() => localStorage.clear());
      await loginPage.goto();

      await loginPage.login('wrong@email.com', 'wrongpassword');
      const error = await loginPage.waitForError();
      await expect(error).toContainText(/credenciales|inválido|error/i);
    });
  });

  test.describe('Token Refresh', () => {
    test('should refresh access token', async ({ request }) => {
      const email = uniqueEmail();
      const { tokens } = await apiRegister(request, {
        name: uniqueName(),
        email,
        password: TEST_PASSWORD,
      });

      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();

      const refreshed = await apiRefreshToken(request, tokens.refreshToken);
      expect(refreshed.tokens.accessToken).toBeTruthy();
      expect(refreshed.tokens.accessToken).not.toBe(tokens.accessToken);
    });

    test('should reject expired or revoked refresh token', async ({ request }) => {
      const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwidHlwZSI6InJlZnJlc2giLCJleHAiOjE1MTYyMzkwMjJ9.fake';
      const res = await request.post(`${API_URL}/api/v1/auth/refresh`, {
        headers: csrfHeaders(),
        data: { refreshToken: fakeToken },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      const auth = await apiRegister(page.request, {
        name: uniqueName(),
        email: uniqueEmail('logout'),
        password: TEST_PASSWORD,
      });
      await applyAuthState(page, auth);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Cerrar sesión' }).click();
      await page.waitForURL(/\/login/, { timeout: 10_000 });

      const loginPage = new LoginPage(page);
      await expect(loginPage.heading).toBeVisible();
    });

    test('should redirect to login when accessing protected routes after logout', async ({ page }) => {
      const auth = await apiRegister(page.request, {
        name: uniqueName(),
        email: uniqueEmail('logout-redirect'),
        password: TEST_PASSWORD,
      });
      await applyAuthState(page, auth);

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.getByRole('button', { name: 'Cerrar sesión' }).click();
      await page.waitForURL(/\/login/);

      await page.goto('/garments');
      await page.waitForURL(/\/login/);

      const loginPage = new LoginPage(page);
      await expect(loginPage.heading).toBeVisible();
    });

    test('should show user profile after login', async ({ page }) => {
      const profilePage = new ProfilePage(page);
      await profilePage.goto();
      await expect(profilePage.heading).toBeVisible();

      const name = await profilePage.getUserName();
      expect(name.length).toBeGreaterThan(0);
    });
  });
});
