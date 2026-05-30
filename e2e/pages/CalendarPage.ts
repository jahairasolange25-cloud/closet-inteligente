import { type Locator, type Page } from '@playwright/test';
import { format } from 'date-fns';

export class CalendarPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly monthLabel: Locator;
  readonly prevMonthButton: Locator;
  readonly nextMonthButton: Locator;
  readonly todayButton: Locator;
  readonly eventCount: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: 'Planificador' });
    this.monthLabel = page.locator('[class*="capitalize"]').filter({ hasText: /^\w+ \d{4}$/ });
    this.prevMonthButton = page.getByRole('button', { name: 'Mes anterior' });
    this.nextMonthButton = page.getByRole('button', { name: 'Mes siguiente' });
    this.todayButton = page.getByRole('button', { name: 'Hoy' });
    this.eventCount = page.locator('text=/outfit.*planificado/');
  }

  async goto() {
    await this.page.goto('/calendar');
    await this.page.waitForLoadState('networkidle');
  }

  async clickDay(day: number) {
    await this.page.getByRole('button').filter({ hasText: new RegExp(`^${day}$`) }).first().click();
  }

  getScheduleModal() {
    return new ScheduleModal(this.page);
  }

  async getPlannedCount(): Promise<number> {
    const text = await this.eventCount.textContent();
    const match = text?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}

export class ScheduleModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dateLabel: Locator;
  readonly outfitOptions: Locator;
  readonly notesTextarea: Locator;
  readonly planificarButton: Locator;
  readonly cancelarButton: Locator;
  readonly eliminarButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog');
    this.dateLabel = this.dialog.locator('[class*="capitalize"]');
    this.outfitOptions = this.dialog.locator('button[aria-pressed]');
    this.notesTextarea = this.dialog.getByLabel(/Notas/);
    this.planificarButton = this.dialog.getByRole('button', { name: /Planificar|Actualizar/ });
    this.cancelarButton = this.dialog.getByRole('button', { name: 'Cancelar' });
    this.eliminarButton = this.dialog.getByRole('button', { name: 'Eliminar' });
  }

  async selectOutfit(name: string) {
    await this.dialog.getByText(name).click();
  }

  async addNotes(notes: string) {
    await this.notesTextarea.fill(notes);
  }

  async save() {
    await this.planificarButton.click();
  }

  async delete() {
    await this.eliminarButton.click();
  }

  async close() {
    await this.cancelarButton.click();
  }
}
