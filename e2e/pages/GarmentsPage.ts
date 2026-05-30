import { type Locator, type Page } from '@playwright/test';

export class GarmentsPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly searchInput: Locator;
  readonly addGarmentButton: Locator;
  readonly filterToggleButton: Locator;
  readonly emptyState: Locator;
  readonly garmentCards: Locator;
  readonly errorAlert: Locator;
  readonly skeletonCards: Locator;
  readonly clearFiltersButton: Locator;
  readonly paginationPrev: Locator;
  readonly paginationNext: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Mi Closet' });
    this.searchInput = page.getByPlaceholder('Buscar prendas...');
    this.addGarmentButton = page.getByRole('link', { name: /Añadir prenda/ });
    this.filterToggleButton = page.getByRole('button', { name: /Filtros/ });
    this.emptyState = page.getByText('Tu closet está vacío');
    this.garmentCards = page.locator('[class*="grid"] a[href^="/garments/"]');
    this.errorAlert = page.getByRole('alert');
    this.skeletonCards = page.getByRole('status');
    this.clearFiltersButton = page.getByRole('button', { name: 'Limpiar filtros' });
    this.paginationPrev = page.getByRole('button', { name: 'Anterior' });
    this.paginationNext = page.getByRole('button', { name: 'Siguiente' });
  }

  async goto() {
    await this.page.goto('/garments');
    await this.page.waitForLoadState('networkidle');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
    await this.page.getByRole('button', { name: 'Buscar' }).click();
  }

  async clearSearch() {
    await this.page.getByRole('button', { name: 'Limpiar búsqueda' }).click();
  }

  async toggleFilters() {
    await this.filterToggleButton.click();
  }

  async waitForListLoad() {
    await this.page.waitForLoadState('networkidle');
    await this.skeletonCards.first().waitFor({ state: 'hidden', timeout: 15_000 }).catch(() => {});
  }

  async isEmpty(): Promise<boolean> {
    return this.emptyState.isVisible();
  }

  async getGarmentCount(): Promise<number> {
    await this.waitForListLoad();
    return this.garmentCards.count();
  }

  async clickGarment(name: string) {
    await this.page.getByRole('link', { name }).first().click();
  }

  async getFirstGarmentId(): Promise<string | null> {
    const href = await this.garmentCards.first().getAttribute('href');
    return href?.replace('/garments/', '') ?? null;
  }
}
