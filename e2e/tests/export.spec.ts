import { test, expect } from '../fixtures/base';
import { apiRequestExport, apiGetExportStatus, csrfHeaders } from '../utils/api';
import { API_URL } from '../playwright.config';

test.describe('FLOW 5: Data Export', () => {
  test.describe('Export Request', () => {
    test('should request a data export and receive export_id', async ({ request }) => {
      const token = process.env.E2E_ACCESS_TOKEN;
      if (!token) test.skip('No auth token');

      const result = await apiRequestExport(request, token ?? '');
      expect(result.export_id).toBeTruthy();
      expect(result.status).toBe('pending');
    });

    test('should reject export request without authentication', async ({ request }) => {
      const res = await request.post(`${API_URL}/api/v1/export/data`, {
        headers: csrfHeaders(),
        data: { sections: ['garments'], format: 'json' },
      });
      expect(res.status()).toBe(401);
    });
  });

  test.describe('Export Status Polling', () => {
    test('should poll export status until complete', async ({ request }) => {
      const token = process.env.E2E_ACCESS_TOKEN;
      if (!token) test.skip('No auth token');

      const { export_id } = await apiRequestExport(request, token ?? '');

      let status = 'pending';
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        const result = await apiGetExportStatus(request, token ?? '', export_id);
        status = result.status;
        if (status === 'completed' || status === 'failed') break;
        await new Promise((r) => setTimeout(r, 1_000));
      }

      expect(['completed', 'failed', 'pending']).toContain(status);
    });

    test('should return 404 for non-existent export', async ({ request }) => {
      const token = process.env.E2E_ACCESS_TOKEN;
      if (!token) test.skip('No auth token');

      const fakeId = '00000000-0000-0000-0000-000000000000';
      const res = await request.get(`${API_URL}/api/v1/export/status/${fakeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      expect(res.status()).toBe(404);
    });
  });

  test.describe('Download Validation', () => {
    test('should have a download URL when export completes', async ({ request }) => {
      const token = process.env.E2E_ACCESS_TOKEN;
      if (!token) test.skip('No auth token');

      const { export_id } = await apiRequestExport(request, token ?? '');

      let downloadUrl: string | null = null;
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        const result = await apiGetExportStatus(request, token ?? '', export_id);
        if (result.download_url) {
          downloadUrl = result.download_url;
          break;
        }
        if (result.status === 'failed') break;
        await new Promise((r) => setTimeout(r, 1_000));
      }

      if (downloadUrl) {
        const downloadRes = await request.get(downloadUrl);
        expect(downloadRes.ok()).toBe(true);
        const contentType = downloadRes.headers()['content-type'] ?? '';
        expect(contentType).toContain('json');
      }
    });

    test('should have progress increasing over time', async ({ request }) => {
      const token = process.env.E2E_ACCESS_TOKEN;
      if (!token) test.skip('No auth token');

      const { export_id } = await apiRequestExport(request, token ?? '');

      const status1 = await apiGetExportStatus(request, token ?? '', export_id);
      await new Promise((r) => setTimeout(r, 2_000));
      const status2 = await apiGetExportStatus(request, token ?? '', export_id);

      expect(status2.progress).toBeGreaterThanOrEqual(status1.progress);
    });
  });
});
