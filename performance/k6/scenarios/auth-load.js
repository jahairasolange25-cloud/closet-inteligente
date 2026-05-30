/**
 * k6 scenario: Auth load test
 * Tests register → login → me → refresh → logout under concurrent load.
 * Goal: p95 < 200ms for login, p99 < 500ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { register, login, getAuthHeaders } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

const loginDuration = new Trend('auth_login_duration', true);
const refreshDuration = new Trend('auth_refresh_duration', true);
const loginErrors = new Rate('auth_login_error_rate');
const tokenRefreshes = new Counter('auth_token_refreshes');

export const options = {
  scenarios: {
    login_spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  thresholds: {
    auth_login_duration: ['p(95)<200', 'p(99)<500'],
    auth_login_error_rate: ['rate<0.01'],
    auth_refresh_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.02'],
  },
};

export function setup() {
  // Pre-create a shared test user for refresh/me tests
  const email = `k6-shared-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, 'K6 Shared Auth User');
  const token = login(email, password);
  return { email, password, token };
}

export default function (data) {
  const { email, password } = data;

  // 1. Login
  const loginStart = Date.now();
  const token = login(email, password);
  loginDuration.add(Date.now() - loginStart);

  if (!token) {
    loginErrors.add(1);
    return;
  }
  loginErrors.add(0);

  const headers = getAuthHeaders(token);

  // 2. Get profile
  const meRes = http.get(`${BASE_URL}/auth/me`, { headers });
  check(meRes, { 'me 200': (r) => r.status === 200 });

  sleep(0.5);

  // 3. Refresh token — get refresh token first by parsing login response
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  if (loginRes.status === 200) {
    const loginBody = JSON.parse(loginRes.body);
    const refreshToken = loginBody.tokens?.refreshToken || loginBody.refreshToken;

    if (refreshToken) {
      const refreshStart = Date.now();
      const refreshRes = http.post(
        `${BASE_URL}/auth/refresh`,
        JSON.stringify({ refreshToken }),
        { headers: { 'Content-Type': 'application/json' } },
      );
      refreshDuration.add(Date.now() - refreshStart);
      check(refreshRes, { 'refresh 200': (r) => r.status === 200 });
      tokenRefreshes.add(1);
    }
  }

  // 4. Logout
  const logoutRes = http.post(`${BASE_URL}/auth/logout`, null, { headers });
  check(logoutRes, { 'logout 200': (r) => r.status === 200 || r.status === 201 });

  sleep(Math.random() * 1 + 0.2);
}

export function teardown(data) {
  console.log(`Auth load test completed. Shared user: ${data.email}`);
}
