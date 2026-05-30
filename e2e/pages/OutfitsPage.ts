import { type Locator, type Page } from '@playwright/test';

export class OutfitsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly createButton: Locator;
  readonly recommendButton: Locator;
  readonly emptyState: Locator;
  readonly outfitCards: Locator;
  readonly errorAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Mis Outfits' });
    this.createButton = page.getByRole('link', { name: /Crear outfit/ });
    this.recommendButton = page.getByRole('button', { name: 'Recomendar' });
    this.emptyState = page.getByText('Sin outfits todavía');
    this.outfitCards = page.locator('a[href^="/outfits/"]').filter({ has: page.locator('[class*="rounded-2xl"]') });
    this.errorAlert = page.getByRole('alert');
  }

  async goto() {
    await this.page.goto('/outfits');
    await this.page.waitForLoadState('networkidle');
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async getOutfitCount(): Promise<number> {
    await this.page.waitForLoadState('networkidle');
    return this.outfitCards.count();
  }

  async clickOutfit(name: string) {
    await this.page.getByRole('link', { name }).first().click();
  }
}

export class NewOutfitPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly nameInput: Locator;
  readonly typeSelect: Locator;
  readonly occasionInput: Locator;
  readonly seasonInput: Locator;
  readonly submitButton: Locator;
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Crear Outfit' });
    this.nameInput = page.getByLabel('Nombre');
    this.typeSelect = page.getByLabel('Tipo');
    this.occasionInput = page.getByLabel('Ocasión');
    this.seasonInput = page.getByLabel('Temporada');
    this.submitButton = page.getByRole('button', { name: /Crear Outfit/ });
    this.backButton = page.getByRole('button', { name: 'Volver' });
  }

  async goto() {
    await this.page.goto('/outfits/new');
    await this.page.waitForLoadState('networkidle');
  }

  async fillForm(data: { name: string; type?: string; occasion?: string; season?: string }) {
    await this.nameInput.fill(data.name);
    if (data.type) await this.typeSelect.selectOption(data.type);
    if (data.occasion) await this.occasionInput.fill(data.occasion);
    if (data.season) await this.seasonInput.fill(data.season);
  }

  async selectGarments(garmentIds: string[]) {
    for (const id of garmentIds) {
      await this.page.locator(`button[aria-pressed="false"][aria-label*="${id}"]`).click().catch(async () => {
        await this.page.locator(`button[aria-label*="${id.slice(0, 8)}"]`).click();
      });
    }
  }

  async submit() {
    await this.submitButton.click();
  }
}

export class OutfitDetailPage {
  readonly page: Page;
  readonly name: Locator;
  readonly favoriteButton: Locator;
  readonly deleteButton: Locator;
  readonly backButton: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteButton: Locator;
  readonly notFound: Locator;

  constructor(page: Page) {
    this.page = page;
    this.name = page.locator('h1');
    this.favoriteButton = page.getByRole('button', { name: /favoritos/i });
    this.deleteButton = page.getByRole('button', { name: 'Eliminar' });
    this.backButton = page.getByRole('button', { name: 'Volver' });
    this.confirmDeleteButton = page.getByRole('button', { name: 'Eliminar' }).last();
    this.cancelDeleteButton = page.getByRole('button', { name: 'Cancelar' });
    this.notFound = page.getByText('Outfit no encontrado');
  }

  async openDeleteModal() {
    await this.deleteButton.click();
  }

  async confirmDelete() {
    await this.confirmDeleteButton.click();
  }
}
