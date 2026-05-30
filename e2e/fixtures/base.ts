import { test as base, expect, type Page } from '@playwright/test';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface TestFixtures {
  goto: (path: string) => Promise<void>;
  /** Get the current access token from the page's localStorage */
  getAccessToken: () => Promise<string | null>;
}

export const test = base.extend<TestFixtures>({
  goto: async ({ page }, use) => {
    await use(async (path: string) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
    });
  },

  getAccessToken: async ({ page }, use) => {
    await use(async () => {
      // Try multiple known auth store keys
      const token = await page.evaluate(() => {
        // Check common auth store keys in localStorage
        const keys = ['auth-store', 'auth', 'auth-token', 'accessToken'];
        for (const key of keys) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const parsed = JSON.parse(raw);
            // zustand persist format: { state: { token, ... } }
            if (parsed.state?.tokens?.accessToken) return parsed.state.tokens.accessToken;
            if (parsed.state?.accessToken) return parsed.state.accessToken;
            if (parsed.tokens?.accessToken) return parsed.tokens.accessToken;
            if (parsed.accessToken) return parsed.accessToken;
            // Try top-level
            if (typeof parsed === 'string' && parsed.length > 20) return parsed;
          } catch {
            // Try raw string
            if (key === 'accessToken') {
              const raw = localStorage.getItem(key);
              if (raw && raw.length > 20) return raw;
            }
          }
        }
        return null;
      });
      return token;
    });
  },
});

// Set the E2E_ACCESS_TOKEN from storage state for any test that needs it for API calls
test.beforeAll(() => {
  try {
    const storagePath = resolve(__dirname, '../playwright/.auth/user.json');
    if (existsSync(storagePath)) {
      const data = JSON.parse(readFileSync(storagePath, 'utf-8'));
      // Look in localStorage for auth token
      for (const origin of data.origins ?? []) {
        for (const item of origin.localStorage ?? []) {
          if (
            item.name === 'closet_access_token' ||
            item.name === process.env.NEXT_PUBLIC_JWT_STORAGE_KEY
          ) {
            process.env.E2E_ACCESS_TOKEN = item.value;
            return;
          }

          try {
            const parsed = JSON.parse(item.value);
            if (parsed.state?.tokens?.accessToken) {
              process.env.E2E_ACCESS_TOKEN = parsed.state.tokens.accessToken;
              return;
            }
          } catch { /* skip */ }
        }
      }
      // Also check cookies
      for (const cookie of data.cookies ?? []) {
        if (cookie.name?.toLowerCase().includes('token') || cookie.name?.toLowerCase().includes('auth')) {
          process.env.E2E_ACCESS_TOKEN = cookie.value;
          return;
        }
      }
    }
  } catch {
    // Storage state not available
  }
});

export { expect };
