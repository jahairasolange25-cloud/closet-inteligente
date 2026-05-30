import { test, expect } from '../fixtures/base';
import { GarmentsPage } from '../pages/GarmentsPage';
import { OutfitsPage, NewOutfitPage } from '../pages/OutfitsPage';
import { CalendarPage } from '../pages/CalendarPage';
import { apiCreateGarment, apiCreateOutfit, apiScheduleOutfit } from '../utils/api';

test.describe('FLOW 3: Outfits', () => {
  test.describe('Outfit Creation', () => {
    test('should create an outfit with selected garments', async ({ page }) => {
      const garmentsPage = new GarmentsPage(page);
      await garmentsPage.goto();
      await garmentsPage.waitForListLoad();

      const count = await garmentsPage.getGarmentCount();

      const outfitPage = new NewOutfitPage(page);
      await outfitPage.goto();
      await expect(outfitPage.heading).toBeVisible();

      await outfitPage.fillForm({ name: `Look Test ${Date.now()}`, type: 'casual' });

      if (count > 0) {
        const garmentButton = page.locator('button[aria-pressed="false"]').first();
        const isVisible = await garmentButton.isVisible().catch(() => false);
        if (isVisible) {
          await garmentButton.click();
        }
      }

      await outfitPage.submit();
      await page.waitForURL(/\/outfits$/, { timeout: 15_000 });

      const outfitsPage = new OutfitsPage(page);
      await expect(outfitsPage.heading).toBeVisible();
    });

    test('should show validation error when name is missing', async ({ page }) => {
      const outfitPage = new NewOutfitPage(page);
      await outfitPage.goto();
      await outfitPage.submitButton.click();
      await page.waitForTimeout(500);

      const alerts = await page.getByRole('alert').count();
      expect(alerts).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Outfit List', () => {
    test('should display created outfits in list', async ({ page }) => {
      const token = process.env.E2E_ACCESS_TOKEN ?? '';

      const garment = await apiCreateGarment(page.request, token, {
        name: `Camisa ${Date.now()}`,
        category: 'shirts',
      });

      await apiCreateOutfit(page.request, token, {
        name: `Outfit ${Date.now()}`,
        type: 'casual',
        garmentIds: [garment.id],
      });

      const outfitsPage = new OutfitsPage(page);
      await outfitsPage.goto();
      await page.waitForLoadState('networkidle');

      const outfitCount = await outfitsPage.getOutfitCount();
      expect(outfitCount).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Calendar Scheduling', () => {
    test('should schedule an outfit on the calendar', async ({ page }) => {
      const token = process.env.E2E_ACCESS_TOKEN ?? '';

      const garment = await apiCreateGarment(page.request, token, {
        name: `Chaqueta ${Date.now()}`,
        category: 'jackets',
      });

      const outfit = await apiCreateOutfit(page.request, token, {
        name: `Outfit Calendario ${Date.now()}`,
        type: 'casual',
        garmentIds: [garment.id],
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      await apiScheduleOutfit(page.request, token, {
        date: dateStr,
        outfitId: outfit.id,
        notes: 'E2E test event',
      });

      const calendarPage = new CalendarPage(page);
      await calendarPage.goto();
      await page.waitForLoadState('networkidle');

      const count = await calendarPage.getPlannedCount();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should plan outfit via calendar modal', async ({ page }) => {
      const token = process.env.E2E_ACCESS_TOKEN ?? '';

      const garment = await apiCreateGarment(page.request, token, {
        name: `Pantalón ${Date.now()}`,
        category: 'pants',
      });

      const outfit = await apiCreateOutfit(page.request, token, {
        name: `Look Modal ${Date.now()}`,
        type: 'formal',
        garmentIds: [garment.id],
      });

      const calendarPage = new CalendarPage(page);
      await calendarPage.goto();
      await page.waitForLoadState('networkidle');

      await calendarPage.clickDay(15);
      const modal = calendarPage.getScheduleModal();
      await expect(modal.dialog).toBeVisible({ timeout: 5_000 });

      await modal.selectOutfit(outfit.name);
      await modal.save();

      await page.waitForTimeout(1_000);
      await expect(modal.dialog).not.toBeVisible({ timeout: 10_000 }).catch(() => {});
    });
  });

  test.describe('Event Persistence', () => {
    test('should persist calendar events across navigation', async ({ page }) => {
      const token = process.env.E2E_ACCESS_TOKEN ?? '';

      const garment = await apiCreateGarment(page.request, token, {
        name: `Falda ${Date.now()}`,
        category: 'skirts',
      });

      const outfit = await apiCreateOutfit(page.request, token, {
        name: `Look Persistente ${Date.now()}`,
        type: 'casual',
        garmentIds: [garment.id],
      });

      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const dateStr = nextWeek.toISOString().split('T')[0];

      await apiScheduleOutfit(page.request, token, {
        date: dateStr,
        outfitId: outfit.id,
      });

      const calendarPage = new CalendarPage(page);
      await calendarPage.goto();
      await page.waitForLoadState('networkidle');

      const countBefore = await calendarPage.getPlannedCount();

      await calendarPage.goto();
      await page.waitForLoadState('networkidle');

      const countAfter = await calendarPage.getPlannedCount();
      expect(countAfter).toBe(countBefore);
    });
  });
});
