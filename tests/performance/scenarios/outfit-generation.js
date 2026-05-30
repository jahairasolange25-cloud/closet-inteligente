import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';
import { login } from '../lib/helpers.js';

const outfitErrorRate = new Rate('outfit_errors');
const outfitCreateDuration = new Trend('outfit_create_duration');
const outfitRecommendDuration = new Trend('outfit_recommend_duration');
const outfitsPerUser = new Trend('outfits_per_user');

export const options = {
  stages: [
    { duration: '10s', target: 10 },
    { duration: '30s', target: 30 },
    { duration: '20s', target: 15 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    outfit_errors: ['rate<0.05'],
    outfit_create_duration: [`p(95)<${THRESHOLDS.p95}`],
    outfit_recommend_duration: [`p(95)<${THRESHOLDS.p95}`],
    http_req_failed: ['rate<0.05'],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  const isRecommend = Math.random() < 0.3;

  if (isRecommend) {
    const tStart = Date.now();
    const res = http.get(`${BASE_URL}/outfits/recommend`, {
      headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
    });
    outfitRecommendDuration.add(Date.now() - tStart);
    const ok = check(res, { 'recommend ok': (r) => r.status === 200 });
    if (!ok) outfitErrorRate.add(1);
  } else {
    const tStart = Date.now();
    const res = http.post(`${BASE_URL}/outfits`, JSON.stringify({
      name: `LoadTest Outfit ${__VU}-${__ITER}`,
      description: 'Generated during performance test',
      garments: [],
      tags: ['load-test', 'performance'],
    }), { headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` } });
    outfitCreateDuration.add(Date.now() - tStart);
    const ok = check(res, { 'outfit created': (r) => r.status === 201 });
    if (!ok) outfitErrorRate.add(1);
  }

  sleep(0.5);
}
