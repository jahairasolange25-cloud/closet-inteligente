import { type Locator, type Page } from '@playwright/test';

export class ProfilePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly saveButton: Locator;
  readonly userId: Locator;
  readonly memberSince: Locator;
  readonly avatarInitials: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Mi Perfil' });
    this.nameInput = page.getByLabel('Nombre');
    this.emailInput = page.getByLabel('Correo electrónico');
    this.saveButton = page.getByRole('button', { name: 'Guardar cambios' });
    this.userId = page.locator('code');
    this.memberSince = page.getByText(/Miembro desde/);
    this.avatarInitials = page.locator('[class*="rounded-full"] span');
  }

  async goto() {
    await this.page.goto('/profile');
    await this.page.waitForLoadState('networkidle');
  }

  async updateName(name: string) {
    await this.nameInput.clear();
    await this.nameInput.fill(name);
    await this.saveButton.click();
  }

  async getUserName(): Promise<string> {
    return (await this.nameInput.inputValue()) || '';
  }
}
