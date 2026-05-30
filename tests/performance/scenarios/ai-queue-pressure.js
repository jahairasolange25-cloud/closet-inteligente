import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { BASE_URL, HEADERS, THRESHOLDS } from '../lib/config.js';
import { login } from '../lib/helpers.js';

const aiQueueErrorRate = new Rate('ai_queue_errors');
const aiQueueDepth = new Trend('ai_queue_depth');
const pipelineDuration = new Trend('pipeline_duration');
const aiStepDuration = new Trend('ai_step_duration');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '60s', target: 10 },
    { duration: '60s', target: 15 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    ai_queue_errors: ['rate<0.10'],
    pipeline_duration: [`p(95)<${THRESHOLDS.p99 * 4}`],
    http_req_failed: ['rate<0.10'],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  const payload = {
    imageUrl: `https://res.cloudinary.com/test/image/upload/v1/test/loadtest-${__VU}-${__ITER}.jpg`,
    garmentId: `loadtest-${__VU}-${__ITER}`,
    uploadId: `upload-${Date.now()}-${__VU}-${__ITER}`,
  };

  const tStart = Date.now();
  const res = http.post(`${BASE_URL}/garments/trigger-pipeline`, JSON.stringify(payload), {
    headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
  });
  const dur = Date.now() - tStart;
  pipelineDuration.add(dur);

  const ok = check(res, {
    'pipeline triggered': (r) => r.status === 201 || r.status === 200,
  });

  if (ok) {
    const { pipelineId } = res.json();
    let status = 'pending';
    let polls = 0;

    while (status === 'pending' || status === 'processing') {
      polls++;
      sleep(2);
      const statusRes = http.get(`${BASE_URL}/garments/${payload.garmentId}/pipeline-status`, {
        headers: { ...HEADERS, Authorization: `Bearer ${TOKEN}` },
      });
      if (statusRes.status === 200) {
        status = statusRes.json().status;
        aiQueueDepth.add(polls);
      } else {
        break;
      }
      if (polls > 30) break;
    }

    check(status, { 'pipeline completed': (s) => s === 'completed' });
    if (status !== 'completed') aiQueueErrorRate.add(1);
  } else {
    aiQueueErrorRate.add(1);
  }

  sleep(2);
}
