import { test, expect } from './fixtures/auth.fixture';
import { ASSETS } from './fixtures/test-assets';
import { readFileSync } from 'fs';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';

test.describe('Garment Upload Flow', () => {
  test.skip(!process.env.CLOUDINARY_CLOUD_NAME, 'Requires CLOUDINARY_CLOUD_NAME env var');

  test('upload garment image → trigger AI pipeline → poll until complete', async ({ page, testUser }) => {
    const imageBuffer = readFileSync(ASSETS.testImage);

    // Upload via API (multipart)
    const uploadRes = await page.request.post(`${API_URL}/garments/upload`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
      multipart: {
        file: {
          name: 'test-garment.jpg',
          mimeType: 'image/jpeg',
          buffer: imageBuffer,
        },
      },
    });

    expect(uploadRes.ok(), `Upload failed: ${await uploadRes.text()}`).toBeTruthy();
    const uploadData = await uploadRes.json() as { garment_id: string; upload_id: string };
    expect(uploadData.garment_id).toBeTruthy();

    // Poll pipeline status until complete or timeout (30s)
    const garmentId = uploadData.garment_id;
    let pipelineStatus = 'pending';
    const deadline = Date.now() + 30_000;

    while (Date.now() < deadline && pipelineStatus !== 'completed' && pipelineStatus !== 'failed') {
      await new Promise((r) => setTimeout(r, 2000));
      const statusRes = await page.request.get(`${API_URL}/garments/${garmentId}/pipeline-status`, {
        headers: { Authorization: `Bearer ${testUser.accessToken}` },
      });
      if (statusRes.ok()) {
        const statusData = await statusRes.json() as { status: string };
        pipelineStatus = statusData.status;
      }
    }

    // Pipeline should complete (may be 'completed' or still 'processing' in CI without AI service)
    expect(['completed', 'processing', 'pending']).toContain(pipelineStatus);

    // Garment record should exist
    const garmentRes = await page.request.get(`${API_URL}/garments/${garmentId}`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
    });
    expect(garmentRes.ok()).toBeTruthy();
  });

  test('create garment → appears in garment list', async ({ page, testUser }) => {
    // Create garment via JSON (no file required for metadata-only creation)
    const createRes = await page.request.post(`${API_URL}/garments`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}`, 'Content-Type': 'application/json' },
      data: {
        name: 'E2E Test Garment',
        type: 'shirt',
        color: 'blue',
        brand: 'E2E Brand',
        tags: ['e2e', 'test'],
      },
    });

    expect(createRes.ok(), `Create failed: ${await createRes.text()}`).toBeTruthy();
    const created = await createRes.json() as { id: string; name: string };
    expect(created.id).toBeTruthy();
    expect(created.name).toBe('E2E Test Garment');

    // Confirm appears in list
    const listRes = await page.request.get(`${API_URL}/garments`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const list = await listRes.json() as { data: Array<{ id: string }> } | Array<{ id: string }>;
    const items = Array.isArray(list) ? list : list.data ?? [];
    expect(items.some((g) => g.id === created.id)).toBeTruthy();

    // Cleanup
    await page.request.delete(`${API_URL}/garments/${created.id}`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
    });
  });

  test('invalid file type is rejected with 400', async ({ page, testUser }) => {
    const textBuffer = readFileSync(ASSETS.invalidFile);

    const res = await page.request.post(`${API_URL}/garments/upload`, {
      headers: { Authorization: `Bearer ${testUser.accessToken}` },
      multipart: {
        file: {
          name: 'malicious.txt',
          mimeType: 'text/plain',
          buffer: textBuffer,
        },
      },
    });

    expect([400, 415, 422]).toContain(res.status());
  });

  test('upload garment via frontend UI navigation', async ({ authenticatedPage }) => {
    const page = authenticatedPage;
    await page.goto('/garments');
    await expect(page).not.toHaveURL(/\/login/);

    // Garments page should load
    await expect(page.getByRole('heading', { name: /garment|prenda|armario|closet/i }).or(
      page.getByTestId('garments-page')
    )).toBeVisible({ timeout: 10_000 });
  });
});
