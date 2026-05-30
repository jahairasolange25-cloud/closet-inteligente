import type { APIRequestContext } from '@playwright/test';

const API_URL = () => process.env.E2E_API_URL ?? 'http://localhost:4000';
const CSRF_TOKEN = process.env.E2E_CSRF_TOKEN ?? 'e2e-csrf-token';

export interface AuthResponse {
  user: { id: string; name: string; email: string };
  tokens: { accessToken: string; refreshToken: string };
}

export interface GarmentPayload {
  name: string;
  category: string;
  color?: string;
  brand?: string;
  size?: string;
  notes?: string;
}

export interface OutfitPayload {
  name: string;
  type: string;
  occasion?: string;
  season?: string;
  garmentIds: string[];
}

export function csrfHeaders(headers: Record<string, string> = {}): Record<string, string> {
  return {
    'x-csrf-token': CSRF_TOKEN,
    Cookie: `csrf-token=${CSRF_TOKEN}`,
    ...headers,
  };
}

/** Resolve a token: use provided, or try env, or login as default e2e user */
async function resolveToken(request: APIRequestContext, token?: string): Promise<string> {
  if (token && token.length > 10 && await isTokenValid(request, token)) return token;
  if (process.env.E2E_ACCESS_TOKEN && process.env.E2E_ACCESS_TOKEN.length > 10) {
    if (await isTokenValid(request, process.env.E2E_ACCESS_TOKEN)) {
      return process.env.E2E_ACCESS_TOKEN;
    }
    console.warn('[E2E API] Cached access token is invalid; logging in again.');
    delete process.env.E2E_ACCESS_TOKEN;
  }
  // Fallback: login with test credentials
  const res = await apiLogin(request,
    process.env.E2E_TEST_EMAIL ?? 'e2e@test.com',
    process.env.E2E_TEST_PASSWORD ?? 'Test1234!',
  );
  process.env.E2E_ACCESS_TOKEN = res.tokens.accessToken;
  return res.tokens.accessToken;
}

async function isTokenValid(request: APIRequestContext, token: string): Promise<boolean> {
  const res = await request.get(`${API_URL()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok();
}

/** Register a new user via API */
export async function apiRegister(
  request: APIRequestContext,
  data: { name: string; email: string; password: string },
): Promise<AuthResponse> {
  const res = await request.post(`${API_URL()}/api/v1/auth/register`, {
    headers: csrfHeaders(),
    data,
  });
  if (!res.ok()) throw new Error(`Register failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Login via API */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<AuthResponse> {
  const res = await request.post(`${API_URL()}/api/v1/auth/login`, {
    headers: csrfHeaders(),
    data: { email, password },
  });
  if (!res.ok()) throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Refresh token */
export async function apiRefreshToken(
  request: APIRequestContext,
  refreshToken: string,
): Promise<AuthResponse> {
  const res = await request.post(`${API_URL()}/api/v1/auth/refresh`, {
    headers: csrfHeaders(),
    data: { refreshToken },
  });
  if (!res.ok()) throw new Error(`Refresh failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** Logout */
export async function apiLogout(
  request: APIRequestContext,
  accessToken: string,
): Promise<void> {
  await request.post(`${API_URL()}/api/v1/auth/logout`, {
    headers: csrfHeaders({ Authorization: `Bearer ${accessToken}` }),
  });
}

/** Create a garment */
export async function apiCreateGarment(
  request: APIRequestContext,
  token: string,
  data: GarmentPayload,
): Promise<{ id: string }> {
  const t = await resolveToken(request, token);
  const res = await request.post(`${API_URL()}/api/v1/garments`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }),
    data,
  });
  if (!res.ok()) throw new Error(`Create garment failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** List garments */
export async function apiListGarments(
  request: APIRequestContext,
  token: string,
  params?: Record<string, string>,
): Promise<{ data: Array<{ id: string; name: string }>; meta: { total: number } }> {
  const t = await resolveToken(request, token);
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  const res = await request.get(`${API_URL()}/api/v1/garments${query ? `?${query}` : ''}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`List garments failed: ${res.status()}`);
  return res.json();
}

/** Get garment by id */
export async function apiGetGarment(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<any> {
  const t = await resolveToken(request, token);
  const res = await request.get(`${API_URL()}/api/v1/garments/${id}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`Get garment failed: ${res.status()}`);
  return res.json();
}

/** Update garment */
export async function apiUpdateGarment(
  request: APIRequestContext,
  token: string,
  id: string,
  data: Partial<GarmentPayload>,
): Promise<void> {
  const t = await resolveToken(request, token);
  const res = await request.patch(`${API_URL()}/api/v1/garments/${id}`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}` }),
    data,
  });
  if (!res.ok()) throw new Error(`Update garment failed: ${res.status()}`);
}

/** Delete garment */
export async function apiDeleteGarment(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  const t = await resolveToken(request, token);
  const res = await request.delete(`${API_URL()}/api/v1/garments/${id}`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}` }),
  });
  if (!res.ok()) throw new Error(`Delete garment failed: ${res.status()}`);
}

/** Create an outfit */
export async function apiCreateOutfit(
  request: APIRequestContext,
  token: string,
  data: OutfitPayload,
): Promise<{ id: string }> {
  const t = await resolveToken(request, token);
  const res = await request.post(`${API_URL()}/api/v1/outfits`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }),
    data,
  });
  if (!res.ok()) throw new Error(`Create outfit failed: ${res.status()} ${await res.text()}`);
  return res.json();
}

/** List outfits */
export async function apiListOutfits(
  request: APIRequestContext,
  token: string,
): Promise<{ data: Array<{ id: string; name: string }>; meta: { total: number } }> {
  const t = await resolveToken(request, token);
  const res = await request.get(`${API_URL()}/api/v1/outfits`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`List outfits failed: ${res.status()}`);
  return res.json();
}

/** Delete outfit */
export async function apiDeleteOutfit(
  request: APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  const t = await resolveToken(request, token);
  const res = await request.delete(`${API_URL()}/api/v1/outfits/${id}`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}` }),
  });
  if (!res.ok()) throw new Error(`Delete outfit failed: ${res.status()}`);
}

/** Schedule an outfit on calendar */
export async function apiScheduleOutfit(
  request: APIRequestContext,
  token: string,
  data: { date: string; outfitId: string; notes?: string },
): Promise<{ id: string }> {
  const t = await resolveToken(request, token);
  const res = await request.post(`${API_URL()}/api/v1/calendar`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }),
    data,
  });
  if (!res.ok()) throw new Error(`Schedule outfit failed: ${res.status()}`);
  return res.json();
}

/** Get calendar events */
export async function apiGetCalendarRange(
  request: APIRequestContext,
  token: string,
  start: string,
  end: string,
): Promise<Array<any>> {
  const t = await resolveToken(request, token);
  const res = await request.get(`${API_URL()}/api/v1/calendar/range?start=${start}&end=${end}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`Get calendar range failed: ${res.status()}`);
  return res.json();
}

/** Request data export */
export async function apiRequestExport(
  request: APIRequestContext,
  token: string,
  data?: { sections?: string[]; format?: string },
): Promise<{ export_id: string; status: string }> {
  const t = await resolveToken(request, token);
  const res = await request.post(`${API_URL()}/api/v1/export/data`, {
    headers: csrfHeaders({ Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }),
    data: data ?? { sections: ['garments', 'outfits'], format: 'json' },
  });
  if (!res.ok()) throw new Error(`Request export failed: ${res.status()}`);
  return res.json();
}

/** Get export status */
export async function apiGetExportStatus(
  request: APIRequestContext,
  token: string,
  exportId: string,
): Promise<{ status: string; progress: number; download_url: string | null }> {
  const t = await resolveToken(request, token);
  const res = await request.get(`${API_URL()}/api/v1/export/status/${exportId}`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`Get export status failed: ${res.status()}`);
  return res.json();
}

/** Get current user profile */
export async function apiGetMe(
  request: APIRequestContext,
  token: string,
): Promise<{ id: string; name: string; email: string }> {
  const t = await resolveToken(request, token);
  const res = await request.get(`${API_URL()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${t}` },
  });
  if (!res.ok()) throw new Error(`Get me failed: ${res.status()}`);
  return res.json();
}
