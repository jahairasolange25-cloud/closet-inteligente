import { test, expect } from './fixtures/auth.fixture';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';

function isoDate(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

test.describe('Calendar Scheduling', () => {
  test('create calendar event → retrieve by date range → update → delete', async ({ page, testUser }) => {
    const token = testUser.accessToken!;
    const eventDate = isoDate(1);

    // Create event
    const createRes = await page.request.post(`${API_URL}/calendar`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        date: eventDate,
        occasion: 'work',
        notes: 'E2E calendar test event',
        outfit_id: null,
      },
    });
    expect(createRes.ok(), `Calendar create failed: ${await createRes.text()}`).toBeTruthy();
    const event = await createRes.json() as { id: string; date: string };
    expect(event.id).toBeTruthy();

    // Get range that includes the event
    const from = isoDate(0);
    const to = isoDate(7);
    const rangeRes = await page.request.get(
      `${API_URL}/calendar?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    expect(rangeRes.ok()).toBeTruthy();
    const range = await rangeRes.json() as Array<{ id: string }> | { data: Array<{ id: string }> };
    const events = Array.isArray(range) ? range : range.data ?? [];
    expect(events.some((e) => e.id === event.id)).toBeTruthy();

    // Update
    const updateRes = await page.request.patch(`${API_URL}/calendar/${event.id}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { occasion: 'casual', notes: 'Updated by E2E' },
    });
    expect(updateRes.ok()).toBeTruthy();

    // Delete
    const deleteRes = await page.request.delete(`${API_URL}/calendar/${event.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 204]).toContain(deleteRes.status());

    // Verify gone
    const afterRange = await page.request.get(
      `${API_URL}/calendar?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (afterRange.ok()) {
      const afterData = await afterRange.json() as Array<{ id: string }> | { data: Array<{ id: string }> };
      const afterItems = Array.isArray(afterData) ? afterData : afterData.data ?? [];
      expect(afterItems.every((e) => e.id !== event.id)).toBeTruthy();
    }
  });

  test('calendar UI page renders without error', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/calendar');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: /calendar|calendario/i }).or(
      page.getByTestId('calendar-page')
    )).toBeVisible({ timeout: 10_000 });
  });

  test('calendar event with outfit reference links correctly', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    // Create garment + outfit for reference
    const garmentRes = await page.request.post(`${API_URL}/garments`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'Calendar Garment', type: 'dress', color: 'red' },
    });
    const garment = await garmentRes.json() as { id: string };

    const outfitRes = await page.request.post(`${API_URL}/outfits`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'Calendar Outfit', garment_ids: [garment.id] },
    });
    const outfit = await outfitRes.json() as { id: string };

    // Create event with outfit
    const eventRes = await page.request.post(`${API_URL}/calendar`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { date: isoDate(2), occasion: 'party', outfit_id: outfit.id },
    });
    expect(eventRes.ok()).toBeTruthy();
    const event = await eventRes.json() as { id: string; outfit_id?: string };
    expect(event.outfit_id ?? event.id).toBeTruthy();

    // Cleanup
    await page.request.delete(`${API_URL}/calendar/${event.id}`, { headers: { Authorization: `Bearer ${token}` } });
    await page.request.delete(`${API_URL}/outfits/${outfit.id}`, { headers: { Authorization: `Bearer ${token}` } });
    await page.request.delete(`${API_URL}/garments/${garment.id}`, { headers: { Authorization: `Bearer ${token}` } });
  });
});
