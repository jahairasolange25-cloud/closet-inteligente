import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';
import { login } from '../lib/helpers.js';

const exportErrorRate = new Rate('export_errors');
const exportRequestDuration = new Trend('export_request_duration');
const exportPollDuration = new Trend('export_poll_duration');
const exportFileSize = new Trend('export_file_size');

export const options = {
  stages: [
    { duration: '10s', target: 5 },
    { duration: '30s', target: 15 },
    { duration: '20s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    export_errors: ['rate<0.05'],
    export_request_duration: [`p(95)<${THRESHOLDS.p95}`],
    http_req_failed: ['rate<0.05'],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  const formats = ['json', 'csv'];
  const format = formats[Math.floor(Math.random() * formats.length)];

  const tStart = Date.now();
  const res = http.post(`${BASE_URL}/export`, JSON.stringify({
    format,
    includeGarments: true,
    includeOutfits: true,
    dateRange: {
      start: '2026-01-01',
      end: '2026-12-31',
    },
  }), { headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` } });
  exportRequestDuration.add(Date.now() - tStart);

  const ok = check(res, { 'export requested': (r) => r.status === 201 || r.status === 200 });
  if (!ok) {
    exportErrorRate.add(1);
    return;
  }

  const { exportId } = res.json();
  let status = 'pending';
  let polls = 0;

  while (status === 'pending' || status === 'processing') {
    polls++;
    sleep(1);
    const tStart2 = Date.now();
    const statusRes = http.get(`${BASE_URL}/export/${exportId}/status`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    if (statusRes.status === 200) {
      status = statusRes.json().status;
      exportPollDuration.add(Date.now() - tStart2);
      if (status === 'completed' && statusRes.json().fileUrl) {
        exportFileSize.add(statusRes.json().fileSize || 0);
      }
    } else {
      break;
    }
    if (polls > 20) break;
  }

  check(status, { 'export completed': (s) => s === 'completed' });
  if (status !== 'completed') exportErrorRate.add(1);

  sleep(1);
}
