import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';

const authErrorRate = new Rate('auth_errors');
const loginDuration = new Trend('login_duration');
const registerDuration = new Trend('register_duration');
const refreshDuration = new Trend('refresh_duration');

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 50 },
    { duration: '20s', target: 100 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    auth_errors: ['rate<0.05'],
    login_duration: [`p(95)<${THRESHOLDS.p95}`, `p(99)<${THRESHOLDS.p99}`],
    http_req_failed: ['rate<0.05'],
  },
};

const USER_POOL = [];

export default function () {
  const isRegister = Math.random() < 0.3;

  if (isRegister) {
    const email = `burst-${Date.now()}-${__VU}-${__ITER}@test.com`;
    const tStart = Date.now();
    const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
      email,
      password: 'BurstTest1234!',
      name: `Burst User ${__VU}-${__ITER}`,
    }), { headers: HEADERS });
    const dur = Date.now() - tStart;
    registerDuration.add(dur);

    const ok = check(res, { 'register ok': (r) => r.status === 201 });
    if (!ok) authErrorRate.add(1);
    if (ok) USER_POOL.push({ email, token: res.json().tokens.accessToken });
  } else {
    const email = `burst-${Date.now()}-${__VU}@test.com`;
    const tStart = Date.now();
    const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
      email: 'e2e@test.com',
      password: 'Test1234!',
    }), { headers: HEADERS });
    const dur = Date.now() - tStart;
    loginDuration.add(dur);

    const ok = check(res, { 'login ok': (r) => r.status === 200 || r.status === 201 });
    if (!ok) authErrorRate.add(1);

    if (ok) {
      sleep(0.5);
      const tStart2 = Date.now();
      const refreshRes = http.post(`${BASE_URL}/auth/refresh`, JSON.stringify({
        refreshToken: res.json().tokens.refreshToken,
      }), { headers: HEADERS });
      const dur2 = Date.now() - tStart2;
      refreshDuration.add(dur2);
      check(refreshRes, { 'refresh ok': (r) => r.status === 200 || r.status === 201 });
    }
  }

  sleep(0.3);
}
