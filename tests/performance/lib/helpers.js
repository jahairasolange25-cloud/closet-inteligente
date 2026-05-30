import http from 'k6/http';
import { check } from 'k6';
import { BASE_URL, HEADERS } from './config.js';

export function login(email, password) {
  const res = http.post(`${BASE_URL}/auth/login`, JSON.stringify({ email, password }), {
    headers: HEADERS,
  });
  check(res, { 'login successful': (r) => r.status === 201 || r.status === 200 });
  if (res.status === 201 || res.status === 200) {
    return res.json().tokens.accessToken;
  }
  return null;
}

export function registerUser() {
  const email = `loadtest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@test.com`;
  const password = 'TestLoad1234!';
  const res = http.post(`${BASE_URL}/auth/register`, JSON.stringify({
    email, password, name: `LoadTest ${Math.random().toString(36).slice(2, 8)}`,
  }), { headers: HEADERS });
  check(res, { 'register successful': (r) => r.status === 201 });
  return res.status === 201 ? { email, password, token: res.json().tokens.accessToken } : null;
}

export function authHeaders(token) {
  return { ...HEADERS, Authorization: `Bearer ${token}` };
}

export function randomFile(sizeKB = 100) {
  const size = sizeKB * 1024;
  const data = new ArrayBuffer(size);
  const view = new Uint8Array(data);
  for (let i = 0; i < size; i++) {
    view[i] = Math.floor(Math.random() * 256);
  }
  return http.file(data, `test-${Date.now()}.jpg`, 'image/jpeg');
}
