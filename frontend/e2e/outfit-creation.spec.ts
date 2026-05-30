import { test, expect } from './fixtures/auth.fixture';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';

async function createGarment(page: import('@playwright/test').Page, token: string, overrides = {}): Promise<string> {
  const res = await page.request.post(`${API_URL}/garments`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { name: 'E2E Outfit Garment', type: 'shirt', color: 'white', ...overrides },
  });
  expect(res.ok()).toBeTruthy();
  const data = await res.json() as { id: string };
  return data.id;
}

test.describe('Outfit Creation', () => {
  test('create outfit with garments → appears in list → update → delete', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    const garment1Id = await createGarment(page, token, { name: 'Shirt E2E', type: 'shirt' });
    const garment2Id = await createGarment(page, token, { name: 'Pants E2E', type: 'pants', color: 'black' });

    // Create outfit
    const createRes = await page.request.post(`${API_URL}/outfits`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        name: 'E2E Test Outfit',
        garment_ids: [garment1Id, garment2Id],
        occasion: 'casual',
        season: 'spring',
        notes: 'Created by E2E test',
      },
    });
    expect(createRes.ok(), `Outfit create failed: ${await createRes.text()}`).toBeTruthy();
    const outfit = await createRes.json() as { id: string; name: string };
    expect(outfit.id).toBeTruthy();

    // Verify in list
    const listRes = await page.request.get(`${API_URL}/outfits`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json() as { data: Array<{ id: string }> } | Array<{ id: string }>;
    const items = Array.isArray(list) ? list : list.data ?? [];
    expect(items.some((o) => o.id === outfit.id)).toBeTruthy();

    // Update
    const updateRes = await page.request.patch(`${API_URL}/outfits/${outfit.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'E2E Updated Outfit', notes: 'Updated by E2E test' },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Verify update
    const getRes = await page.request.get(`${API_URL}/outfits/${outfit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const updated = await getRes.json() as { name: string };
    expect(updated.name).toBe('E2E Updated Outfit');

    // Delete
    const deleteRes = await page.request.delete(`${API_URL}/outfits/${outfit.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(deleteRes.status());

    // Cleanup garments
    await page.request.delete(`${API_URL}/garments/${garment1Id}`, { headers: { Authorization: `Bearer ${token}` } });
    await page.request.delete(`${API_URL}/garments/${garment2Id}`, { headers: { Authorization: `Bearer ${token}` } });
  });

  test('outfit recommendations endpoint returns results', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    const res = await page.request.get(`${API_URL}/outfits/recommend`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    // May return empty array if no garments — but should not 500
    expect([200, 400]).toContain(res.status());
  });

  test('outfit creation UI navigation works', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/outfits');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /outfit|look|conjunto/i }).or(
      page.getByTestId('outfits-page')
    )).toBeVisible({ timeout: 10_000 });
  });

  test('outfit detail page loads for existing outfit', async ({ page, testUser }) => {
    const token = testUser.accessToken!;
    const garmentId = await createGarment(page, token, { name: 'Detail Test Garment' });

    const createRes = await page.request.post(`${API_URL}/outfits`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'Detail Test Outfit', garment_ids: [garmentId] },
    });
    const outfit = await createRes.json() as { id: string };

    // Navigate to detail page
    await page.evaluate(
      ([access, refresh]: string[]) => {
        localStorage.setItem('closet_access_token', access);
        localStorage.setItem('closet_refresh_token', refresh);
      },
      [token, testUser.refreshToken ?? ''],
    );

    await page.goto(`/outfits/${outfit.id}`);
    await expect(page).not.toHaveURL(/\/login/);

    // Cleanup
    await page.request.delete(`${API_URL}/outfits/${outfit.id}`, { headers: { Authorization: `Bearer ${token}` } });
    await page.request.delete(`${API_URL}/garments/${garmentId}`, { headers: { Authorization: `Bearer ${token}` } });
  });
});
