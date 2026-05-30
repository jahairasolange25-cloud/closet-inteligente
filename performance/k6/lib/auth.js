import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

export const E2E_EMAIL = __ENV.K6_TEST_EMAIL || `k6-${Date.now()}@closet-perf.test`;
export const E2E_PASSWORD = __ENV.K6_TEST_PASSWORD || 'K6perfPass!99';

let _cachedToken = null;

export function register(email, password, name) {
  const res = http.post(
    `${BASE_URL}/auth/register`,
    JSON.stringify({ email, password, name }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'register 201 or 409': (r) => r.status === 201 || r.status === 409 });
  return res;
}

export function login(email, password) {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(res, { 'login 200': (r) => r.status === 200 });
  if (res.status === 200) {
    const body = JSON.parse(res.body);
    return body.tokens?.accessToken || body.accessToken || null;
  }
  return null;
}

export function getAuthHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'X-Platform': 'web',
    'X-Client-Version': '0.1.0',
  };
}

export function setupUser() {
  const email = `k6-${__VU}-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, `K6 User ${__VU}`);
  return login(email, password);
}
