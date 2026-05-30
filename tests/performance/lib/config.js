export const BASE_URL = __ENV.BASE_URL || 'http://localhost/api/v1';
export const WS_URL = __ENV.WS_URL || 'http://localhost/ws';
export const ADMIN_USER = {
  email: __ENV.TEST_EMAIL || 'e2e@test.com',
  password: __ENV.TEST_PASSWORD || 'Test1234!',
};

export const THRESHOLDS = {
  p95: 2000,
  p99: 5000,
  errorRate: 0.05,
};

export const HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};
