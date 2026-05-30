/**
 * k6 scenario: DB connection pool saturation test
 * Tests behavior when all DB connections are in use.
 * Goal: no connection leaks, graceful queuing, p99 < 3000ms under saturation
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { register, login, getAuthHeaders } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

const queryDuration = new Trend('db_query_duration', true);
const queryErrors = new Rate('db_query_error_rate');

export const options = {
  scenarios: {
    saturation: {
      executor: 'constant-vus',
      vus: 80,  // Exceeds typical pg pool size of 20-50
      duration: '3m',
    },
  },
  thresholds: {
    db_query_duration: ['p(95)<2000', 'p(99)<3000'],
    db_query_error_rate: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const email = `k6-dbsat-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, 'K6 DB Saturation User');
  const token = login(email, password);
  return { email, password, token };
}

export default function (data) {
  const token = login(data.email, data.password);
  if (!token) {
    queryErrors.add(1);
    return;
  }

  const headers = getAuthHeaders(token);

  // Mix of read-heavy DB queries to saturate pool
  const operations = [
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/garments?limit=50&offset=${(__VU * 10) % 100}`, { headers });
      queryDuration.add(Date.now() - start);
      return check(res, { 'garments list ok': (r) => r.status === 200 });
    },
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/outfits?limit=20`, { headers });
      queryDuration.add(Date.now() - start);
      return check(res, { 'outfits list ok': (r) => r.status === 200 });
    },
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/calendar?from=2026-01-01&to=2026-12-31`, { headers });
      queryDuration.add(Date.now() - start);
      return check(res, { 'calendar range ok': (r) => r.status === 200 });
    },
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/analytics/dashboard`, { headers });
      queryDuration.add(Date.now() - start);
      return check(res, { 'analytics ok': (r) => r.status === 200 || r.status === 404 });
    },
    () => {
      const start = Date.now();
      const res = http.get(`${BASE_URL}/notifications`, { headers });
      queryDuration.add(Date.now() - start);
      return check(res, { 'notifications ok': (r) => r.status === 200 });
    },
  ];

  // Run 3 operations per VU iteration
  for (let i = 0; i < 3; i++) {
    const op = operations[(__VU + i) % operations.length];
    const ok = op();
    if (!ok) queryErrors.add(1);
    else queryErrors.add(0);
    sleep(0.05);
  }

  sleep(Math.random() * 0.2);
}
