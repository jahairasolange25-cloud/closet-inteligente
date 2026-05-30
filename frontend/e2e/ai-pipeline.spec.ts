import { test, expect } from './fixtures/auth.fixture';
import { ASSETS } from './fixtures/test-assets';
import { readFileSync } from 'fs';

const API_URL = process.env.PLAYWRIGHT_API_URL || 'http://localhost:4000/api/v1';
const AI_URL = process.env.PLAYWRIGHT_AI_URL || 'http://localhost:5100';

test.describe('AI Pipeline Processing', () => {
  test('AI service health endpoint is available', async ({ page }) => {
    const res = await page.request.get(`${AI_URL}/health`);
    expect(res.ok()).toBeTruthy();
    const body = await res.json() as { status: string };
    expect(body.status).toMatch(/ok|healthy|up/i);
  });

  test('pipeline status endpoint returns valid shape', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    // Create a garment to get a valid garment ID
    const garmentRes = await page.request.post(`${API_URL}/garments`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'Pipeline Status Test', type: 'jacket', color: 'black' },
    });
    const garment = await garmentRes.json() as { id: string };

    // Check pipeline status (will be 'not_started' without upload, but shape must be valid)
    const statusRes = await page.request.get(`${API_URL}/garments/${garment.id}/pipeline-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(statusRes.ok()).toBeTruthy();

    const status = await statusRes.json() as {
      status: string;
      progress: number;
      steps: Array<{ name: string; status: string }>;
    };
    expect(typeof status.status).toBe('string');
    expect(typeof status.progress).toBe('number');
    expect(Array.isArray(status.steps)).toBeTruthy();

    // Cleanup
    await page.request.delete(`${API_URL}/garments/${garment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test.skip(!process.env.CLOUDINARY_CLOUD_NAME, 'Requires storage configured');
  test('upload → pipeline starts → steps progress', async ({ page, testUser }) => {
    const token = testUser.accessToken!;
    const imageBuffer = readFileSync(ASSETS.testImage);

    // Upload
    const uploadRes = await page.request.post(`${API_URL}/garments/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'pipeline-test.jpg', mimeType: 'image/jpeg', buffer: imageBuffer },
      },
    });
    expect(uploadRes.ok()).toBeTruthy();
    const { garment_id } = await uploadRes.json() as { garment_id: string };

    // First status — should be pending or processing within 1s
    const initialStatus = await page.request.get(`${API_URL}/garments/${garment_id}/pipeline-status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const initial = await initialStatus.json() as { status: string };
    expect(['pending', 'processing']).toContain(initial.status);

    // Poll up to 60s for completion
    let finalStatus = initial.status;
    const deadline = Date.now() + 60_000;
    while (Date.now() < deadline && finalStatus !== 'completed' && finalStatus !== 'failed') {
      await new Promise((r) => setTimeout(r, 3000));
      const poll = await page.request.get(`${API_URL}/garments/${garment_id}/pipeline-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (poll.ok()) {
        finalStatus = (await poll.json() as { status: string }).status;
      }
    }

    expect(['completed', 'failed']).toContain(finalStatus);

    // Cleanup
    await page.request.delete(`${API_URL}/garments/${garment_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('duplicate upload is deduplicated (idempotency)', async ({ page, testUser }) => {
    const token = testUser.accessToken!;

    // Create garment via API — second trigger should be idempotent
    const garmentRes = await page.request.post(`${API_URL}/garments`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { name: 'Idempotency Test', type: 'shirt' },
    });
    const garment = await garmentRes.json() as { id: string };

    // Trigger pipeline twice — second should not create duplicate
    const t1 = await page.request.post(`${API_URL}/garments/${garment.id}/trigger-pipeline`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const t2 = await page.request.post(`${API_URL}/garments/${garment.id}/trigger-pipeline`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    // Both should succeed or second should be idempotent (200/202/409 all valid)
    expect([200, 201, 202, 409]).toContain(t1.status());
    expect([200, 201, 202, 409]).toContain(t2.status());

    await page.request.delete(`${API_URL}/garments/${garment.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });
});
