import { test, expect } from '../fixtures/base';
import { GarmentsPage } from '../pages/GarmentsPage';
import { GarmentFormPage } from '../pages/GarmentFormPage';
import { VALID_GARMENT } from '../utils/fixtures';
import { apiCreateGarment } from '../utils/api';

test.describe('FLOW 2: Garments', () => {
  test.describe('Create Garment', () => {
    test('should create a garment with valid data', async ({ page }) => {
      const garmentsPage = new GarmentsPage(page);
      const formPage = new GarmentFormPage(page);

      await garmentsPage.goto();
      await garmentsPage.addGarmentButton.click();
      await formPage.fillForm(VALID_GARMENT);
      await formPage.submit();

      await formPage.waitForRedirectToDetail();
      await expect(page.getByRole('heading', { name: VALID_GARMENT.name })).toBeVisible();
    });

    test('should show validation errors for empty required fields', async ({ page }) => {
      const formPage = new GarmentFormPage(page);
      await formPage.goto();

      await formPage.submitButton.click();
      await page.waitForTimeout(500);

      const alerts = await page.getByRole('alert').count();
      expect(alerts).toBeGreaterThanOrEqual(1);
    });

    test('should show the new garment in the closet list', async ({ page }) => {
      const uniqueNameVal = `Vestido ${Date.now()}`;
      const garment = await apiCreateGarment(page.request, process.env.E2E_ACCESS_TOKEN ?? '', {
        name: uniqueNameVal,
        category: 'dresses',
      });

      const garmentsPage = new GarmentsPage(page);
      await garmentsPage.goto();
      await garmentsPage.waitForListLoad();

      await expect(page.getByText(uniqueNameVal)).toBeVisible();
    });
  });

  test.describe('Garment Search', () => {
    test('should filter garments by search term', async ({ page }) => {
      const garmentsPage = new GarmentsPage(page);
      await garmentsPage.goto();
      await garmentsPage.waitForListLoad();

      const initialCount = await garmentsPage.getGarmentCount();
      if (initialCount === 0) test.skip('No garments to search');

      await garmentsPage.search('Vestido');
      await page.waitForTimeout(1_000);
    });
  });

  test.describe('Edit Garment', () => {
    test('should edit a garment name from detail page', async ({ page }) => {
      const garmentsPage = new GarmentsPage(page);
      await garmentsPage.goto();
      await garmentsPage.waitForListLoad();

      const count = await garmentsPage.getGarmentCount();
      if (count === 0) test.skip('No garments to edit');

      const firstCard = page.locator('a[href^="/garments/"]').first();
      await firstCard.click();
      await page.waitForURL(/\/garments\/[0-9a-f-]+/);

      const editButton = page.getByRole('button', { name: 'Editar prenda' });
      await expect(editButton).toBeVisible();
      await editButton.click();

      const nameInput = page.getByLabel('Nombre de la prenda');
      const newName = `Editado ${Date.now()}`;
      await nameInput.clear();
      await nameInput.fill(newName);

      await page.getByRole('button', { name: 'Guardar' }).click();
      await page.waitForTimeout(1_000);

      await expect(page.getByRole('heading', { name: newName })).toBeVisible();
    });
  });

  test.describe('Delete Garment', () => {
    test('should delete a garment', async ({ page }) => {
      const garmentsPage = new GarmentsPage(page);
      await garmentsPage.goto();
      await garmentsPage.waitForListLoad();

      const count = await garmentsPage.getGarmentCount();
      if (count === 0) test.skip('No garments to delete');

      const firstCard = page.locator('a[href^="/garments/"]').first();
      await firstCard.click();
      await page.waitForURL(/\/garments\/[0-9a-f-]+/);

      await page.getByRole('button', { name: 'Eliminar prenda' }).click();
      await page.getByText('Eliminar', { exact: true }).last().click();

      await page.waitForURL('/garments', { timeout: 10_000 });
      await expect(garmentsPage.heading).toBeVisible();
    });
  });
});
