import type { Page } from '@playwright/test';
import type { AuthResponse } from './api';

const ACCESS_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY ?? 'closet_access_token';
const REFRESH_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY ?? 'closet_refresh_token';
const STORE_KEY = 'closet-auth';

export async function applyAuthState(page: Page, auth: AuthResponse) {
  await page.addInitScript(
    ({ accessKey, refreshKey, storeKey, authData }) => {
      window.localStorage.setItem(accessKey, authData.tokens.accessToken);
      window.localStorage.setItem(refreshKey, authData.tokens.refreshToken);
      window.sessionStorage.setItem(
        storeKey,
        JSON.stringify({
          state: { user: authData.user, isAuthenticated: true },
          version: 0,
        }),
      );
    },
    {
      accessKey: ACCESS_KEY,
      refreshKey: REFRESH_KEY,
      storeKey: STORE_KEY,
      authData: auth,
    },
  );
}
