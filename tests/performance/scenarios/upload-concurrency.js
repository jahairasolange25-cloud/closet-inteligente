import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';
import { login, randomFile } from '../lib/helpers.js';

const uploadErrorRate = new Rate('upload_errors');
const uploadDuration = new Trend('upload_duration');
const uploadSize = new Trend('upload_size_bytes');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '60s', target: 20 },
    { duration: '30s', target: 10 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    upload_errors: ['rate<0.05'],
    upload_duration: [`p(95)<${THRESHOLDS.p95 * 3}`, `p(99)<${THRESHOLDS.p99 * 3}`],
    http_req_failed: ['rate<0.10'],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  const fileSizes = [50, 100, 500, 1024];
  const sizeKB = fileSizes[Math.floor(Math.random() * fileSizes.length)];

  const fileData = randomFile(sizeKB);
  const formData = {
    file: fileData,
    name: `Load Test Garment ${__VU}-${__ITER}`,
    category: 'tops',
    color: 'blue',
  };

  const tStart = Date.now();
  const res = http.post(`${BASE_URL}/garments`, formData, {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  const dur = Date.now() - tStart;

  uploadDuration.add(dur);
  uploadSize.add(sizeKB * 1024);

  const ok = check(res, {
    'upload ok': (r) => r.status === 201 || r.status === 200,
    'upload has id': (r) => r.json('id') !== undefined,
  });

  if (!ok) uploadErrorRate.add(1);

  sleep(1);
}
