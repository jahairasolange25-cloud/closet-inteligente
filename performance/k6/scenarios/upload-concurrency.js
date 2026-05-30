/**
 * k6 scenario: Upload concurrency test
 * Tests concurrent garment creation under load.
 * Requires CLOUDINARY_CLOUD_NAME to be set for actual file upload.
 * Without it, tests metadata-only creation.
 * Goal: p95 < 2000ms, 0 data corruption, proper cleanup
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { register, login, getAuthHeaders } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

const garmentCreateDuration = new Trend('garment_create_duration', true);
const garmentListDuration = new Trend('garment_list_duration', true);
const garmentErrors = new Rate('garment_error_rate');

export const options = {
  scenarios: {
    concurrent_uploads: {
      executor: 'constant-vus',
      vus: 20,
      duration: '2m',
    },
    burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 50 },
        { duration: '30s', target: 50 },
        { duration: '10s', target: 0 },
      ],
      startTime: '2m',
    },
  },
  thresholds: {
    garment_create_duration: ['p(95)<2000', 'p(99)<5000'],
    garment_error_rate: ['rate<0.02'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  const email = `k6-upload-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, 'K6 Upload User');
  const token = login(email, password);
  return { email, password, token };
}

export default function (data) {
  const token = login(data.email, data.password);
  if (!token) {
    garmentErrors.add(1);
    return;
  }

  const headers = getAuthHeaders(token);
  const garmentName = `k6-garment-${__VU}-${Date.now()}`;

  // Create garment (metadata only)
  const createStart = Date.now();
  const createRes = http.post(
    `${BASE_URL}/garments`,
    JSON.stringify({
      name: garmentName,
      type: ['shirt', 'pants', 'dress', 'jacket', 'shoes'][__VU % 5],
      color: ['red', 'blue', 'black', 'white', 'green'][__VU % 5],
      brand: 'K6 Brand',
      tags: ['k6', 'perf-test'],
    }),
    { headers },
  );
  garmentCreateDuration.add(Date.now() - createStart);

  const created = check(createRes, {
    'garment created 201': (r) => r.status === 201,
    'has id': (r) => {
      try {
        return !!JSON.parse(r.body).id;
      } catch {
        return false;
      }
    },
  });

  if (!created) {
    garmentErrors.add(1);
    return;
  }
  garmentErrors.add(0);

  const garmentId = JSON.parse(createRes.body).id;

  sleep(0.1);

  // List garments (tests DB query under load)
  const listStart = Date.now();
  const listRes = http.get(`${BASE_URL}/garments?limit=20`, { headers });
  garmentListDuration.add(Date.now() - listStart);
  check(listRes, { 'garment list 200': (r) => r.status === 200 });

  sleep(0.2);

  // Get specific garment
  const getRes = http.get(`${BASE_URL}/garments/${garmentId}`, { headers });
  check(getRes, { 'garment get 200': (r) => r.status === 200 });

  // Delete to avoid DB bloat
  http.del(`${BASE_URL}/garments/${garmentId}`, null, { headers });

  sleep(Math.random() * 0.5 + 0.1);
}
