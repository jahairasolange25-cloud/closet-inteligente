import { check, sleep } from 'k6';
import ws from 'k6/ws';
import { Rate, Trend } from 'k6/metrics';
import { WS_URL, THRESHOLDS } from '../lib/config.js';
import { login } from '../lib/helpers.js';

const wsConnectErrors = new Rate('ws_connect_errors');
const wsConnectDuration = new Trend('ws_connect_duration');
const wsMessageLatency = new Trend('ws_message_latency');
const wsReconnectCount = new Trend('ws_reconnect_count');

export const options = {
  stages: [
    { duration: '10s', target: 20 },
    { duration: '30s', target: 100 },
    { duration: '20s', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    ws_connect_errors: ['rate<0.05'],
    ws_message_latency: [`p(95)<${THRESHOLDS.p95}`],
    http_req_failed: ['rate<0.05'],
  },
};

const TOKEN = login('e2e@test.com', 'Test1234!');

export default function () {
  if (!TOKEN) return;

  const tStart = Date.now();
  const url = `${WS_URL}?token=${TOKEN}`;

  const res = ws.connect(url, {}, function (socket) {
    socket.on('open', () => {
      wsConnectDuration.add(Date.now() - tStart);
    });

    socket.on('message', (data) => {
      wsMessageLatency.add(Date.now() - tStart);
    });

    socket.on('error', (e) => {
      wsConnectErrors.add(1);
    });

    socket.setTimeout(() => {
      socket.close();
    }, 15000);

    socket.send(JSON.stringify({ event: 'sync:request', data: {} }));
  });

  check(res, { 'websocket connected': (r) => r && r.status === 101 });

  sleep(1);
}
