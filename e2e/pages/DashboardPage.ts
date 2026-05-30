import { type Locator, type Page } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly greeting: Locator;
  readonly quickAddGarment: Locator;
  readonly quickCreateOutfit: Locator;
  readonly quickPlanDay: Locator;
  readonly recentGarments: Locator;
  readonly garmentsStat: Locator;
  readonly outfitsStat: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /buenos días|buenas tardes|buenas noches/i });
    this.greeting = this.heading;
    this.quickAddGarment = page.getByRole('link', { name: 'Añadir prenda' });
    this.quickCreateOutfit = page.getByRole('link', { name: 'Crear outfit' });
    this.quickPlanDay = page.getByRole('link', { name: 'Planificar día' });
    this.recentGarments = page.getByRole('heading', { name: 'Prendas recientes' });
    this.garmentsStat = page.getByRole('link', { name: /Prendas/ });
    this.outfitsStat = page.getByRole('link', { name: /Outfits/ });
  }

  async goto() {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  async getUserName(): Promise<string> {
    const text = await this.greeting.textContent();
    return text?.replace(/^(Buenos días|Buenas tardes|Buenas noches),\s+/, '').replace(/\s+.*$/, '') ?? '';
  }
}
