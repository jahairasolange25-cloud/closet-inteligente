import { type Locator, type Page } from '@playwright/test';

export class RegisterPage {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly acceptTermsCheckbox: Locator;
  readonly consentAICheckbox: Locator;
  readonly submitButton: Locator;
  readonly errorAlert: Locator;
  readonly loginLink: Locator;
  readonly heading: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByLabel('Nombre');
    this.emailInput = page.getByLabel('Email');
    this.passwordInput = page.getByLabel(/^contraseña\*?$/i);
    this.confirmPasswordInput = page.getByLabel('Confirmar contraseña');
    this.acceptTermsCheckbox = page.getByRole('checkbox', { name: /términos y condiciones/i });
    this.consentAICheckbox = page.getByRole('checkbox', { name: /uso de IA/i });
    this.submitButton = page.getByRole('button', { name: 'Crear Cuenta' });
    this.errorAlert = page.getByRole('alert');
    this.loginLink = page.getByRole('link', { name: 'Inicia sesión' });
    this.heading = page.getByRole('heading', { name: 'Crear Cuenta' });
  }

  async goto() {
    await this.page.goto('/register');
    await this.page.waitForLoadState('networkidle');
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
    acceptTerms?: boolean;
    consentAI?: boolean;
  }) {
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.passwordInput.fill(data.password);
    await this.confirmPasswordInput.fill(data.confirmPassword ?? data.password);
    if (data.acceptTerms !== false) {
      await this.acceptTermsCheckbox.check();
    }
    if (data.consentAI) {
      await this.consentAICheckbox.check();
    }
    await this.submitButton.click();
  }

  async waitForError() {
    await this.errorAlert.waitFor({ state: 'visible' });
    return this.errorAlert;
  }
}
