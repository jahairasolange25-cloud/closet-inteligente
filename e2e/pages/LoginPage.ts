import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel(/^contraseña\*?$/i);
    this.submitButton = page.getByRole('button', { name: 'Iniciar Sesión' });
    this.errorAlert = page.getByRole('alert');
    this.registerLink = page.getByRole('link', { name: 'Regístrate' });
    this.forgotPasswordLink = page.getByRole('link', { name: '¿Olvidaste tu contraseña?' });
    this.heading = page.getByRole('heading', { name: 'Iniciar Sesión' });
  }

  async goto() {
    await this.page.goto('/login');
    await this.page.waitForLoadState('networkidle');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async waitForError() {
    await this.errorAlert.waitFor({ state: 'visible' });
    return this.errorAlert;
  }

  async isLoggedIn(): Promise<boolean> {
    await this.page.waitForURL(
      (url) => ['/', '/garments', '/outfits', '/calendar', '/profile'].includes(url.pathname),
      { timeout: 15_000 },
    );
    return true;
  }

  async expectValidationError() {
    await this.page.waitForTimeout(500);
    const emailError = this.page.getByRole('alert').first();
    const passwordError = this.page.getByRole('alert').last();
    return { emailError, passwordError };
  }
}
