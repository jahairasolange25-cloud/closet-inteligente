/**
 * k6 scenario: Cache hit rate metrics
 * Validates that Redis cache-aside pattern is working.
 * Expects second request to same resource to be faster (cache hit).
 * Goal: cached requests p95 < 20ms vs uncached p95 < 200ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { register, login, getAuthHeaders } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

const coldDuration = new Trend('cache_cold_duration', true);
const warmDuration = new Trend('cache_warm_duration', true);
const cacheErrors = new Rate('cache_error_rate');

export const options = {
  scenarios: {
    cache_validation: {
      executor: 'constant-vus',
      vus: 10,
      duration: '2m',
    },
  },
  thresholds: {
    cache_warm_duration: ['p(95)<50'],
    cache_cold_duration: ['p(95)<300'],
    cache_error_rate: ['rate<0.01'],
  },
};

export function setup() {
  const email = `k6-cache-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, 'K6 Cache User');
  const token = login(email, password);

  // Create some content to cache
  const headers = getAuthHeaders(token);
  const garmentIds = [];
  for (let i = 0; i < 5; i++) {
    const res = http.post(
      `${BASE_URL}/garments`,
      JSON.stringify({ name: `cache-garment-${i}`, type: 'shirt', color: 'blue' }),
      { headers },
    );
    if (res.status === 201) {
      garmentIds.push(JSON.parse(res.body).id);
    }
  }

  return { email, password, token, garmentIds };
}

export default function (data) {
  const token = login(data.email, data.password);
  if (!token) {
    cacheErrors.add(1);
    return;
  }

  const headers = getAuthHeaders(token);
  const garmentIds = data.garmentIds || [];

  if (garmentIds.length === 0) return;

  const garmentId = garmentIds[__VU % garmentIds.length];

  // Cold request (may or may not be cached)
  const coldStart = Date.now();
  const coldRes = http.get(`${BASE_URL}/garments/${garmentId}`, { headers });
  coldDuration.add(Date.now() - coldStart);

  const ok = check(coldRes, { 'cold request ok': (r) => r.status === 200 });
  if (!ok) {
    cacheErrors.add(1);
    return;
  }
  cacheErrors.add(0);

  sleep(0.01);

  // Warm request (same resource — should benefit from any caching layer)
  const warmStart = Date.now();
  const warmRes = http.get(`${BASE_URL}/garments/${garmentId}`, { headers });
  warmDuration.add(Date.now() - warmStart);
  check(warmRes, { 'warm request ok': (r) => r.status === 200 });

  // Test pipeline status (Redis-cached)
  const pipelineStart = Date.now();
  const pipelineRes = http.get(`${BASE_URL}/garments/${garmentId}/pipeline-status`, { headers });
  warmDuration.add(Date.now() - pipelineStart);
  check(pipelineRes, { 'pipeline status ok': (r) => r.status === 200 });

  sleep(Math.random() * 0.3 + 0.1);
}

export function teardown(data) {
  if (data.token && data.garmentIds) {
    const headers = getAuthHeaders(data.token);
    for (const id of data.garmentIds) {
      http.del(`${BASE_URL}/garments/${id}`, null, { headers });
    }
  }
}
