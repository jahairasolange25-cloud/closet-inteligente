import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';
import { login } from '../lib/helpers.js';

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '60s', target: 50 },
    { duration: '60s', target: 80 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.08'],
    http_req_duration: [`p(95)<${THRESHOLDS.p95 * 2}`, `p(99)<${THRESHOLDS.p99 * 2}`],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  group('auth', function () {
    const meRes = http.get(`${BASE_URL}/auth/me`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(meRes, { 'auth/me ok': (r) => r.status === 200 });
    sleep(0.2);
  });

  group('garments', function () {
    const listRes = http.get(`${BASE_URL}/garments?limit=20&offset=0`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(listRes, { 'garments list ok': (r) => r.status === 200 });
    sleep(0.3);

    if (listRes.status === 200 && listRes.json().data && listRes.json().data.length > 0) {
      const id = listRes.json().data[0].id;
      const detailRes = http.get(`${BASE_URL}/garments/${id}`, {
        headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
      });
      check(detailRes, { 'garment detail ok': (r) => r.status === 200 });
      sleep(0.2);
    }
  });

  group('outfits', function () {
    const listRes = http.get(`${BASE_URL}/outfits?limit=10`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(listRes, { 'outfits list ok': (r) => r.status === 200 });
    sleep(0.3);
  });

  group('analytics', function () {
    const statsRes = http.get(`${BASE_URL}/analytics/garment-stats`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(statsRes, { 'analytics ok': (r) => r.status === 200 });
    sleep(0.2);

    const dashboardRes = http.get(`${BASE_URL}/analytics/dashboard`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(dashboardRes, { 'dashboard ok': (r) => r.status === 200 });
    sleep(0.2);
  });

  group('notifications', function () {
    const notifRes = http.get(`${BASE_URL}/notifications`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(notifRes, { 'notifications ok': (r) => r.status === 200 });
    sleep(0.2);
  });

  group('calendar', function () {
    const calRes = http.get(`${BASE_URL}/calendar/range?start=2026-01-01&end=2026-12-31`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    check(calRes, { 'calendar ok': (r) => r.status === 200 });
    sleep(0.2);
  });

  sleep(0.5);
}
