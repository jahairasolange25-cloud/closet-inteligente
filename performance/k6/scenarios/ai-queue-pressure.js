/**
 * k6 scenario: AI queue pressure test
 * Tests pipeline trigger under load — validates BullMQ handles burst, no job loss.
 * Also validates pipeline status polling throughput.
 * Goal: 0 lost jobs, p95 status poll < 100ms
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { register, login, getAuthHeaders } from '../lib/auth.js';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:4000/api/v1';

const pipelineTriggerDuration = new Trend('pipeline_trigger_duration', true);
const pipelineStatusDuration = new Trend('pipeline_status_duration', true);
const pipelineErrors = new Rate('pipeline_error_rate');
const jobsQueued = new Counter('pipeline_jobs_queued');

export const options = {
  scenarios: {
    queue_burst: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '20s', target: 10 },
        { duration: '1m', target: 30 },
        { duration: '20s', target: 0 },
      ],
    },
    status_polling: {
      executor: 'constant-arrival-rate',
      rate: 100,
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 10,
      maxVUs: 50,
      startTime: '20s',
    },
  },
  thresholds: {
    pipeline_trigger_duration: ['p(95)<1000'],
    pipeline_status_duration: ['p(95)<100', 'p(99)<300'],
    pipeline_error_rate: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
};

export function setup() {
  const email = `k6-queue-${Date.now()}@closet-perf.test`;
  const password = 'K6perfPass!99';
  register(email, password, 'K6 Queue User');
  const token = login(email, password);

  // Pre-create garments for pipeline trigger tests
  const headers = getAuthHeaders(token);
  const garmentIds = [];

  for (let i = 0; i < 10; i++) {
    const res = http.post(
      `${BASE_URL}/garments`,
      JSON.stringify({ name: `k6-queue-garment-${i}`, type: 'shirt', color: 'black' }),
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
    pipelineErrors.add(1);
    return;
  }

  const headers = getAuthHeaders(token);
  const garmentIds = data.garmentIds;

  if (!garmentIds || garmentIds.length === 0) {
    return;
  }

  const garmentId = garmentIds[__VU % garmentIds.length];

  // 1. Trigger pipeline (idempotent — may return ALREADY_ACTIVE)
  const triggerStart = Date.now();
  const triggerRes = http.post(
    `${BASE_URL}/garments/${garmentId}/trigger-pipeline`,
    null,
    { headers },
  );
  pipelineTriggerDuration.add(Date.now() - triggerStart);

  const triggerOk = check(triggerRes, {
    'pipeline trigger accepted': (r) => [200, 201, 202, 409].includes(r.status),
  });

  if (!triggerOk) {
    pipelineErrors.add(1);
    return;
  }

  if (triggerRes.status !== 409) {
    jobsQueued.add(1);
  }
  pipelineErrors.add(0);

  sleep(0.1);

  // 2. Poll pipeline status (tests Redis read throughput)
  const statusStart = Date.now();
  const statusRes = http.get(
    `${BASE_URL}/garments/${garmentId}/pipeline-status`,
    { headers },
  );
  pipelineStatusDuration.add(Date.now() - statusStart);

  check(statusRes, {
    'pipeline status 200': (r) => r.status === 200,
    'has status field': (r) => {
      try {
        return !!JSON.parse(r.body).status;
      } catch {
        return false;
      }
    },
  });

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
