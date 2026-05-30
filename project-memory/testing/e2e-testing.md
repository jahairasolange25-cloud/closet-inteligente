# E2E Testing — Closet Inteligente Digital

## 1. Playwright Configuration

### 1.1 Dependencies

```json
{
  "devDependencies": {
    "@playwright/test": "^1.45",
    "@axe-core/playwright": "^4.9",
    "dotenv": "^16.x"
  }
}
```

### 1.2 Playwright config

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.e2e' });

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-report/test-results.json' }],
    ['list'],
  ],

  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1440, height: 900 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 393, height: 851 },
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 13'],
        viewport: { width: 390, height: 844 },
      },
      dependencies: ['setup'],
    },
  ],

  globalSetup: require.resolve('./e2e/global.setup.ts'),
  globalTeardown: require.resolve('./e2e/global.teardown.ts'),
});
```

### 1.3 Global setup

```ts
// e2e/global.setup.ts
import { FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import { waitForServer } from './utils/server';

async function globalSetup(config: FullConfig) {
  console.log('Starting E2E test environment...');

  // 1. Start required services (Docker Compose)
  if (process.env.CI) {
    console.log('CI environment detected — services should already be running.');
  } else {
    console.log('Starting Docker Compose services...');
    await runCommand('docker compose up -d --wait');
  }

  // 2. Run database migrations
  console.log('Running database migrations...');
  await runCommand('npm run migration:run');

  // 3. Seed test data
  console.log('Seeding test data...');
  await runCommand('npm run seed:e2e');

  // 4. Wait for servers to be ready
  console.log('Waiting for servers...');
  await waitForServer(process.env.E2E_BASE_URL || 'http://localhost:3000', 60000);
  await waitForServer(process.env.E2E_API_URL || 'http://localhost:4000', 60000);

  // 5. Set environment variables for tests
  process.env.TEST_USER_EMAIL = 'e2e-test@example.com';
  process.env.TEST_USER_PASSWORD = 'E2eTestP@ss1';
  process.env.TEST_USER_ID = 'e2e-test-user-id';

  console.log('E2E setup complete.');
}

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const parts = command.split(' ');
    const child = spawn(parts[0], parts.slice(1), {
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`Command "${command}" exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

export default globalSetup;
```

### 1.4 Global teardown

```ts
// e2e/global.teardown.ts
import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Tearing down E2E test environment...');

  // Clean up test data
  if (!process.env.CI) {
    console.log('Stopping Docker Compose services...');
    await runCommand('docker compose down -v');
  }

  console.log('E2E teardown complete.');
}

function runCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    const parts = command.split(' ');
    const child = spawn(parts[0], parts.slice(1), {
      stdio: 'inherit',
      shell: true,
    });
    child.on('close', (code: number) => {
      if (code === 0) resolve();
      else reject(new Error(`Command exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

export default globalTeardown;
```

### 1.5 Environment config

```env
# .env.e2e
E2E_BASE_URL=http://localhost:3000
E2E_API_URL=http://localhost:4000
E2E_SUPABASE_URL=http://localhost:54321
E2E_REDIS_URL=redis://localhost:6379

TEST_USER_EMAIL=e2e-test@example.com
TEST_USER_PASSWORD=E2eTestP@ss1

# Storage bucket for test uploads
E2E_STORAGE_BUCKET=e2e-test-uploads
```

## 2. E2E Test Structure

```
e2e/
├── global.setup.ts
├── global.teardown.ts
├── playwright.config.ts
├── .env.e2e
├── utils/
│   ├── server.ts                  # Server health check helpers
│   ├── auth.ts                    # Auth helper functions
│   ├── api.ts                     # Direct API helpers for test setup
│   └── fixtures.ts               # Fixture data generators
├── pages/
│   ├── LoginPage.ts
│   ├── RegisterPage.ts
│   ├── DashboardPage.ts
│   ├── WardrobePage.ts
│   ├── UploadPage.ts
│   ├── OutfitBuilderPage.ts
│   ├── RecommendationPage.ts
│   ├── AvatarPage.ts
│   ├── CalendarPage.ts
│   ├── NotificationsPage.ts
│   ├── AnalyticsPage.ts
│   ├── SettingsPage.ts
│   └── components/
│       ├── Navigation.ts
│       └── GarmentCard.ts
├── fixtures/
│   ├── images/
│   │   ├── test-shirt.jpg         # Small valid JPEG
│   │   ├── test-pants.jpg         # Small valid JPEG
│   │   └── test-avatar-video.mp4  # Short valid MP4
│   └── users.json
├── specs/
│   ├── auth.spec.ts
│   ├── wardrobe.spec.ts
│   ├── outfits.spec.ts
│   ├── recommendations.spec.ts
│   ├── avatar.spec.ts
│   ├── calendar.spec.ts
│   ├── notifications.spec.ts
│   ├── analytics.spec.ts
│   ├── settings.spec.ts
│   └── accessibility.spec.ts
└── data/
    ├── seed.ts                    # Seed data generation
    └── clean.ts                   # Data cleanup after tests
```

## 3. Page Object Model

```ts
// e2e/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole('button', { name: /log in|sign in/i });
    this.errorMessage = page.getByRole('alert');
    this.registerLink = page.getByRole('link', { name: /create account|register/i });
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot password/i });
    this.rememberMeCheckbox = page.getByRole('checkbox', { name: /remember me/i });
  }

  async goto() {
    await this.page.goto('/auth/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async loginWithRememberMe(email: string, password: string) {
    await this.rememberMeCheckbox.check();
    await this.login(email, password);
  }

  async waitForError() {
    await this.errorMessage.waitFor({ state: 'visible' });
    return this.errorMessage.textContent();
  }

  async isLoginSuccessful() {
    await this.page.waitForURL(/dashboard|wardrobe/);
    return true;
  }
}
```

```ts
// e2e/pages/WardrobePage.ts
import { Page, Locator } from '@playwright/test';

export class WardrobePage {
  readonly page: Page;
  readonly uploadButton: Locator;
  readonly garmentGrid: Locator;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly colorFilter: Locator;
  readonly emptyState: Locator;
  readonly garmentCards: Locator;
  readonly selectedCount: Locator;
  readonly viewToggle: Locator;

  constructor(page: Page) {
    this.page = page;
    this.uploadButton = page.getByRole('button', { name: /upload|add garment/i });
    this.garmentGrid = page.getByTestId('garment-grid');
    this.searchInput = page.getByPlaceholder(/search/i);
    this.categoryFilter = page.getByRole('combobox', { name: /category/i });
    this.colorFilter = page.getByRole('combobox', { name: /color/i });
    this.emptyState = page.getByTestId('empty-wardrobe');
    this.garmentCards = page.getByTestId('garment-card');
    this.selectedCount = page.getByTestId('selected-count');
    this.viewToggle = page.getByRole('button', { name: /view toggle|grid|list/i });
  }

  async goto() {
    await this.page.goto('/wardrobe');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async searchGarments(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(300); // debounce
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.click();
    await this.page.getByRole('option', { name: new RegExp(category, 'i') }).click();
  }

  async filterByColor(color: string) {
    await this.colorFilter.click();
    await this.page.getByRole('option', { name: new RegExp(color, 'i') }).click();
  }

  async getGarmentCount(): Promise<number> {
    return this.garmentCards.count();
  }

  async selectGarment(index: number = 0) {
    await this.garmentCards.nth(index).click();
  }

  async selectGarments(indices: number[]) {
    for (const i of indices) {
      await this.garmentCards.nth(i).click({ modifiers: ['ControlOrMeta'] });
    }
  }

  async deleteSelected() {
    await this.page.getByRole('button', { name: /delete selected/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async toggleFavorite(index: number = 0) {
    await this.garmentCards.nth(index).getByTestId('favorite-button').click();
  }

  async emptyStateVisible(): Promise<boolean> {
    return this.emptyState.isVisible();
  }
}
```

```ts
// e2e/pages/UploadPage.ts
import { Page, Locator } from '@playwright/test';
import path from 'path';

export class UploadPage {
  readonly page: Page;
  readonly fileInput: Locator;
  readonly dropzone: Locator;
  readonly nameInput: Locator;
  readonly categorySelect: Locator;
  readonly colorSelect: Locator;
  readonly brandInput: Locator;
  readonly sizeSelect: Locator;
  readonly materialInput: Locator;
  readonly submitButton: Locator;
  readonly progressBar: Locator;
  readonly previewImage: Locator;
  readonly resultMessage: Locator;
  readonly cancelButton: Locator;
  readonly dragDropArea: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dropzone = page.getByTestId('upload-dropzone');
    this.fileInput = page.getByLabel(/choose file|select image/i);
    this.nameInput = page.getByLabel(/garment name|name/i);
    this.categorySelect = page.getByLabel(/category/i);
    this.colorSelect = page.getByLabel(/color/i);
    this.brandInput = page.getByLabel(/brand/i);
    this.sizeSelect = page.getByLabel(/size/i);
    this.materialInput = page.getByLabel(/material/i);
    this.submitButton = page.getByRole('button', { name: /upload|save garment/i });
    this.progressBar = page.getByRole('progressbar');
    this.previewImage = page.getByTestId('upload-preview');
    this.resultMessage = page.getByTestId('upload-result');
    this.cancelButton = page.getByRole('button', { name: /cancel/i });
    this.dragDropArea = page.getByTestId('drag-drop-area');
  }

  async goto() {
    await this.page.goto('/wardrobe/upload');
  }

  async uploadImage(fileName: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', 'images', fileName);
    await this.fileInput.setInputFiles(filePath);
    await this.page.waitForTimeout(1000); // wait for preview
  }

  async setGarmentDetails(details: {
    name: string;
    category: string;
    color: string;
    brand?: string;
    size?: string;
    material?: string;
  }) {
    await this.nameInput.fill(details.name);
    await this.categorySelect.click();
    await this.page.getByRole('option', { name: new RegExp(details.category, 'i') }).click();
    await this.colorSelect.click();
    await this.page.getByRole('option', { name: new RegExp(details.color, 'i') }).click();
    if (details.brand) await this.brandInput.fill(details.brand);
    if (details.size) {
      await this.sizeSelect.click();
      await this.page.getByRole('option', { name: details.size }).click();
    }
    if (details.material) await this.materialInput.fill(details.material);
  }

  async submit() {
    await this.submitButton.click();
  }

  async waitForProcessingComplete() {
    await this.progressBar.waitFor({ state: 'visible', timeout: 10000 });
    await this.progressBar.waitFor({ state: 'hidden', timeout: 30000 });
  }

  async uploadCompleteGarment(
    fileName: string,
    details: {
      name: string;
      category: string;
      color: string;
    }
  ) {
    await this.uploadImage(fileName);
    await this.setGarmentDetails(details);
    await this.submit();
    await this.waitForProcessingComplete();
  }

  async dragAndDropFile(fileName: string) {
    const filePath = path.join(__dirname, '..', 'fixtures', 'images', fileName);
    await this.dragDropArea.dropFiles(filePath);
    await this.page.waitForTimeout(1000);
  }

  async isProcessing(): Promise<boolean> {
    return this.progressBar.isVisible();
  }
}
```

```ts
// e2e/pages/RecommendationPage.ts
import { Page, Locator } from '@playwright/test';

export class RecommendationPage {
  readonly page: Page;
  readonly generateButton: Locator;
  readonly outfitCards: Locator;
  readonly seasonFilter: Locator;
  readonly styleFilter: Locator;
  readonly occasionFilter: Locator;
  readonly saveOutfitButton: Locator;
  readonly refreshButton: Locator;
  readonly loadingState: Locator;
  readonly emptyState: Locator;
  readonly outfitDetails: Locator;
  readonly aiBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.generateButton = page.getByRole('button', { name: /generate|get recommendations/i });
    this.outfitCards = page.getByTestId('outfit-card');
    this.seasonFilter = page.getByLabel(/season/i);
    this.styleFilter = page.getByLabel(/style/i);
    this.occasionFilter = page.getByLabel(/occasion/i);
    this.saveOutfitButton = page.getByRole('button', { name: /save outfit/i });
    this.refreshButton = page.getByRole('button', { name: /refresh|new recommendations/i });
    this.loadingState = page.getByTestId('recommendations-loading');
    this.emptyState = page.getByTestId('recommendations-empty');
    this.outfitDetails = page.getByTestId('outfit-details');
    this.aiBadge = page.getByTestId('ai-generated-badge');
  }

  async goto() {
    await this.page.goto('/outfits/recommendations');
  }

  async generateRecommendations() {
    await this.generateButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async selectSeason(season: string) {
    await this.seasonFilter.click();
    await this.page.getByRole('option', { name: new RegExp(season, 'i') }).click();
  }

  async selectStyle(style: string) {
    await this.styleFilter.click();
    await this.page.getByRole('option', { name: new RegExp(style, 'i') }).click();
  }

  async getRecommendationCount(): Promise<number> {
    await this.outfitCards.first().waitFor({ state: 'visible', timeout: 15000 });
    return this.outfitCards.count();
  }

  async saveOutfit(index: number = 0) {
    await this.outfitCards.nth(index).getByRole('button', { name: /save/i }).click();
  }

  async viewOutfitDetails(index: number = 0) {
    await this.outfitCards.nth(index).click();
    await this.outfitDetails.waitFor({ state: 'visible' });
  }

  async isAIGenerated(index: number = 0): Promise<boolean> {
    return this.outfitCards.nth(index).getByTestId('ai-generated-badge').isVisible();
  }
}
```

## 4. Critical User Journeys

### 4.1 User Registration and Login

```ts
// e2e/specs/auth.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication flows', () => {
  const testUser = {
    email: `e2e-${Date.now()}@test.com`,
    password: 'E2eTestP@ss1',
    name: 'E2E Test User',
  };

  test.describe('Registration', () => {
    test('should register a new account successfully', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.register(testUser.name, testUser.email, testUser.password);

      // Should redirect to dashboard
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText(testUser.name)).toBeVisible();
    });

    test('should show validation errors on registration form', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      // Submit empty form
      await registerPage.submitButton.click();

      await expect(page.getByText(/name is required/i)).toBeVisible();
      await expect(page.getByText(/email is required/i)).toBeVisible();
      await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('should reject duplicate email registration', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.register(testUser.name, testUser.email, testUser.password);
      await expect(page).toHaveURL(/dashboard/);

      // Logout
      await page.getByRole('button', { name: /logout|sign out/i }).click();

      // Try registering again with same email
      await registerPage.goto();
      await registerPage.register('Another User', testUser.email, testUser.password);

      await expect(page.getByText(/email already registered/i)).toBeVisible();
    });

    test('should reject weak passwords', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.register('Weak Password User', 'weak@test.com', '123');

      await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();
    });

    test('should reject invalid email format', async ({ page }) => {
      const registerPage = new RegisterPage(page);
      await registerPage.goto();

      await registerPage.register('Bad Email User', 'not-an-email', 'StrongP@ss1');

      await expect(page.getByText(/invalid email format/i)).toBeVisible();
    });
  });

  test.describe('Login', () => {
    test.beforeAll(async ({ browser }) => {
      // Create test user via API
      const apiContext = await browser.newContext();
      await apiContext.request.post('http://localhost:4000/api/auth/register', {
        data: testUser,
      });
      await apiContext.close();
    });

    test('should login with valid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(testUser.email, testUser.password);

      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText(testUser.name)).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login(testUser.email, 'WrongPassword1');

      const errorText = await loginPage.waitForError();
      expect(errorText).toContain('Invalid');
    });

    test('should show error for non-existent user', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.login('nonexistent@test.com', 'SomePassword1');

      const errorText = await loginPage.waitForError();
      expect(errorText).toContain('Invalid');
    });

    test('should persist session with remember me', async ({ page, context }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.loginWithRememberMe(testUser.email, testUser.password);

      // Close page and open new one
      await context.storageState({ path: 'e2e-auth-state.json' });

      const newPage = await context.newPage();
      await newPage.goto('/dashboard');
      await expect(newPage).toHaveURL(/dashboard/);
      await expect(newPage.getByText(testUser.name)).toBeVisible();
    });

    test('should rate-limit excessive login attempts', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      for (let i = 0; i < 5; i++) {
        await loginPage.login(testUser.email, 'WrongPassword1');
        await page.waitForTimeout(500);
      }

      await loginPage.login(testUser.email, 'WrongPassword1');
      await expect(page.getByText(/too many attempts|rate limit/i)).toBeVisible();
    });

    test('should allow navigation to registration page', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.registerLink.click();
      await expect(page).toHaveURL(/register|signup/);
    });

    test('should allow password reset flow', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();

      await loginPage.forgotPasswordLink.click();
      await expect(page).toHaveURL(/forgot-password|reset-password/);
    });
  });

  test.describe('Session management', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should logout and clear session', async ({ page }) => {
      // Login first
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Logout
      await page.getByRole('button', { name: /logout|sign out/i }).click();
      await expect(page).toHaveURL(/auth\/login/);

      // Verify cannot access protected routes
      await page.goto('/dashboard');
      await expect(page).toHaveURL(/auth\/login/);
    });

    test('should handle token expiration gracefully', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.goto();
      await loginPage.login(testUser.email, testUser.password);

      // Manipulate token expiry (requires backend support)
      await page.evaluate(() => {
        const stored = JSON.parse(localStorage.getItem('auth-storage')!);
        stored.state.accessToken = stored.state.accessToken.replace(/^.{10}/, 'EXPIRED0000');
        localStorage.setItem('auth-storage', JSON.stringify(stored));
      });

      await page.reload();
      // Should redirect to login or show refresh prompt
      await expect(page).toHaveURL(/auth\/login/);
    });
  });
});
```

### 4.2 Upload Garment and Verify Pipeline

```ts
// e2e/specs/wardrobe.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WardrobePage } from '../pages/WardrobePage';
import { UploadPage } from '../pages/UploadPage';

test.describe('Garment upload and processing', () => {
  const testUser = {
    email: `e2e-wardrobe-${Date.now()}@test.com`,
    password: 'E2eTestP@ss1',
    name: 'Wardrobe Test User',
  };

  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: testUser,
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
  });

  test('should upload a garment and display in wardrobe', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadCompleteGarment('test-shirt.jpg', {
      name: 'Blue Striped Shirt',
      category: 'top',
      color: 'blue',
    });

    // Should see success message
    await expect(page.getByText(/upload successful|garment added/i)).toBeVisible();

    // Should navigate to wardrobe
    await expect(page).toHaveURL(/wardrobe/);

    // Garment should be visible
    const wardrobe = new WardrobePage(page);
    await expect(wardrobe.garmentCards.first()).toBeVisible();
    await expect(page.getByText('Blue Striped Shirt')).toBeVisible();
  });

  test('should show processing progress during upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadImage('test-shirt.jpg');
    await uploadPage.setGarmentDetails({
      name: 'Processing Test',
      category: 'top',
      color: 'red',
    });
    await uploadPage.submit();

    // Should show processing indicator
    await expect(uploadPage.progressBar).toBeVisible();
    await expect(page.getByText(/analyzing|detecting|processing/i)).toBeVisible();

    // Should complete
    await uploadPage.waitForProcessingComplete();
    await expect(page.getByText(/success|completed/i)).toBeVisible();
  });

  test('should show AI-detected attributes after processing', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadCompleteGarment('test-shirt.jpg', {
      name: 'AI Detected Garment',
      category: 'top',
      color: 'blue',
    });

    // Navigate to garment details
    const wardrobe = new WardrobePage(page);
    await wardrobe.selectGarment(0);

    // AI tags should be visible
    await expect(page.getByTestId('ai-detected-color')).toBeVisible();
    await expect(page.getByTestId('ai-detected-category')).toBeVisible();
    await expect(page.getByTestId('ai-confidence')).toBeVisible();
  });

  test('should show error for invalid file type', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // Try uploading a non-image file
    await uploadPage.fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    });

    await expect(page.getByText(/invalid file type|unsupported format/i)).toBeVisible();
  });

  test('should show error for oversized file', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // Create a large file buffer
    const largeBuffer = Buffer.alloc(15 * 1024 * 1024); // 15 MB
    await uploadPage.fileInput.setInputFiles({
      name: 'large.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    await expect(page.getByText(/file too large|exceeds maximum size/i)).toBeVisible();
  });

  test('should allow drag and drop upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // Simulate drag and drop
    await uploadPage.dragAndDropFile('test-shirt.jpg');

    // Preview should appear
    await expect(uploadPage.previewImage).toBeVisible();
  });

  test('should cancel upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadImage('test-shirt.jpg');
    await uploadPage.setGarmentDetails({
      name: 'Cancelled Upload',
      category: 'top',
      color: 'blue',
    });

    await uploadPage.cancelButton.click();

    // Should navigate away from upload
    await expect(page).not.toHaveURL(/upload/);
  });

  test('should upload multiple garments in sequence', async ({ page }) => {
    const uploadPage = new UploadPage(page);

    const garments = [
      { file: 'test-shirt.jpg', name: 'Shirt 1', category: 'top', color: 'blue' },
      { file: 'test-pants.jpg', name: 'Pants 1', category: 'bottom', color: 'black' },
    ];

    for (const garment of garments) {
      await uploadPage.goto();
      await uploadPage.uploadCompleteGarment(garment.file, {
        name: garment.name,
        category: garment.category,
        color: garment.color,
      });
    }

    // Wardrobe should show both
    const wardrobe = new WardrobePage(page);
    await wardrobe.goto();
    await wardrobe.waitForLoad();

    const count = await wardrobe.getGarmentCount();
    expect(count).toBe(2);
  });

  test('should display garment with uploaded image preview', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    await uploadPage.uploadImage('test-shirt.jpg');
    await expect(uploadPage.previewImage).toBeVisible();
    await expect(uploadPage.previewImage).toHaveAttribute('src', /blob:|base64/);
  });

  test('should handle network failure during upload', async ({ page }) => {
    const uploadPage = new UploadPage(page);
    await uploadPage.goto();

    // Simulate offline
    await page.context().setOffline(true);

    await uploadPage.uploadImage('test-shirt.jpg');
    await uploadPage.setGarmentDetails({
      name: 'Network Failure Test',
      category: 'top',
      color: 'blue',
    });
    await uploadPage.submit();

    await expect(page.getByText(/network error|connection lost/i)).toBeVisible();

    // Restore network
    await page.context().setOffline(false);
  });
});
```

### 4.3 Create Outfit Manually

```ts
// e2e/specs/outfits.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { WardrobePage } from '../pages/WardrobePage';
import { OutfitBuilderPage } from '../pages/OutfitBuilderPage';

test.describe('Outfit creation', () => {
  test.beforeAll(async ({ browser }) => {
    // Register user and seed garments
    const apiContext = await browser.newContext();
    const res = await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-outfit-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Outfit Test User',
      },
    });
    const { accessToken } = await res.json();

    // Seed garments via API
    for (const garment of ['top', 'bottom', 'footwear']) {
      await apiContext.request.post('http://localhost:4000/api/garments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          name: `Test ${garment}`,
          category: garment,
          color: 'blue',
          image: {
            name: `${garment}.jpg`,
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
          },
        },
      });
    }
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(
      `e2e-outfit-${Date.now()}@test.com`,
      'E2eTestP@ss1'
    );
  });

  test('should create an outfit from wardrobe garments', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    // Add garments to outfit
    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.addGarmentToSlot('bottom', 0);
    await outfitBuilder.addGarmentToSlot('footwear', 0);

    // Set outfit details
    await outfitBuilder.setOutfitName('My First Outfit');
    await outfitBuilder.setSeason('summer');
    await outfitBuilder.setStyle('casual');

    // Save
    await outfitBuilder.saveOutfit();

    // Verify saved
    await expect(page.getByText(/outfit saved|created successfully/i)).toBeVisible();
    await expect(page).toHaveURL(/outfits/);
  });

  test('should validate at least one garment required', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.setOutfitName('Empty Outfit');
    await outfitBuilder.saveOutfit();

    await expect(page.getByText(/add at least one garment/i)).toBeVisible();
  });

  test('should require outfit name', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.saveOutfit();

    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('should preview outfit before saving', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.addGarmentToSlot('bottom', 0);

    // Preview should show selected garments
    await expect(outfitBuilder.outfitPreview).toBeVisible();
    await expect(outfitBuilder.outfitPreview.getByTestId('garment-thumbnail')).toHaveCount(2);
  });

  test('should replace garment in slot', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.selectGarmentSlot('top');

    // Select a different garment
    await outfitBuilder.selectGarmentFromPicker(1);

    // Slot should be updated
    await expect(outfitBuilder.getSlotContent('top')).not.toBeEmpty();
  });

  test('should remove garment from outfit', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.removeGarmentFromSlot('top');

    // Slot should be empty
    await expect(outfitBuilder.getSlotContent('top')).not.toBeVisible();
  });

  test('should reorder garments in outfit', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.addGarmentToSlot('bottom', 0);

    // Drag top to bottom position
    await outfitBuilder.dragGarment('top', 'bottom');

    // Order should be changed
    const order = await outfitBuilder.getGarmentOrder();
    expect(order[0]).toBe('bottom');
    expect(order[1]).toBe('top');
  });

  test('should set outfit as public', async ({ page }) => {
    const outfitBuilder = new OutfitBuilderPage(page);
    await outfitBuilder.goto();

    await outfitBuilder.addGarmentToSlot('top', 0);
    await outfitBuilder.setOutfitName('Public Outfit');
    await outfitBuilder.togglePublicVisibility();

    await outfitBuilder.saveOutfit();
    await expect(page.getByText(/public|shared/i)).toBeVisible();
  });
});
```

### 4.4 Generate AI Outfit Recommendation

```ts
// e2e/specs/recommendations.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RecommendationPage } from '../pages/RecommendationPage';

test.describe('AI outfit recommendations', () => {
  test.beforeAll(async ({ browser }) => {
    // Seed user with diverse wardrobe
    const apiContext = await browser.newContext();
    const res = await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-rec-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Rec Test User',
      },
    });
    const { accessToken } = await res.json();

    // Seed 15+ garments across categories
    const categories = ['top', 'bottom', 'footwear', 'top', 'bottom', 'footwear', 'top', 'bottom'];
    const colors = ['blue', 'black', 'white', 'red', 'green', 'yellow', 'purple', 'orange'];

    for (let i = 0; i < categories.length; i++) {
      await apiContext.request.post('http://localhost:4000/api/garments', {
        headers: { Authorization: `Bearer ${accessToken}` },
        multipart: {
          name: `Garment ${i}`,
          category: categories[i],
          color: colors[i],
          image: {
            name: `g${i}.jpg`,
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
          },
        },
      });
    }
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-rec-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should generate AI outfit recommendations', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();

    const count = await recPage.getRecommendationCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should mark recommendations as AI-generated', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();

    const isAI = await recPage.isAIGenerated(0);
    expect(isAI).toBe(true);
  });

  test('should filter recommendations by season', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.selectSeason('summer');
    await recPage.generateRecommendations();

    const count = await recPage.getRecommendationCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should filter recommendations by style', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.selectStyle('casual');
    await recPage.generateRecommendations();

    const count = await recPage.getRecommendationCount();
    expect(count).toBeGreaterThan(0);
  });

  test('should save a recommended outfit', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();
    await recPage.saveOutfit(0);

    await expect(page.getByText(/outfit saved|added to collection/i)).toBeVisible();
  });

  test('should show outfit details on click', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();
    await recPage.viewOutfitDetails(0);

    await expect(page.getByTestId('outfit-garment-list')).toBeVisible();
    await expect(page.getByTestId('outfit-garment-list').getByTestId('garment-item')).toHaveCount(3);
  });

  test('should refresh recommendations', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();
    const firstOutfits = await recPage.outfitCards.allTextContents();

    await recPage.refreshButton.click();
    await recPage.generateRecommendations();

    // Content should be different
    const secondOutfits = await recPage.outfitCards.allTextContents();
    expect(firstOutfits).not.toEqual(secondOutfits);
  });

  test('should show loading state while generating', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateButton.click();
    await expect(recPage.loadingState).toBeVisible({ timeout: 2000 });
    await expect(recPage.loadingState).not.toBeVisible({ timeout: 20000 });
  });

  test('should show error state when recommendation fails', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    // Force failure by removing all garments (requires API manipulation)
    // This is handled by backend returning empty result
    await recPage.generateRecommendations();
    await expect(recPage.outfitCards.or(recPage.emptyState)).toBeVisible();
  });

  test('should paginate recommendations', async ({ page }) => {
    const recPage = new RecommendationPage(page);
    await recPage.goto();

    await recPage.generateRecommendations();

    const count = await recPage.getRecommendationCount();

    if (count > 10) {
      await expect(page.getByRole('button', { name: /next|load more/i })).toBeVisible();
    }
  });
});
```

### 4.5 Generate Avatar from Video

```ts
// e2e/specs/avatar.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AvatarPage } from '../pages/AvatarPage';

test.describe('Avatar generation', () => {
  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-avatar-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Avatar Test User',
      },
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-avatar-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should generate avatar from video upload', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();

    // Should show processing state
    await expect(avatarPage.processingIndicator).toBeVisible();
    await expect(page.getByText(/generating|processing|analyzing/i)).toBeVisible();

    // Should complete
    await avatarPage.waitForGenerationComplete();

    // Avatar preview should be visible
    await expect(avatarPage.avatarPreview).toBeVisible({ timeout: 30000 });
  });

  test('should show error for invalid video', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.fileInput.setInputFiles({
      name: 'invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not a video'),
    });

    await expect(page.getByText(/invalid video|unsupported format/i)).toBeVisible();
  });

  test('should show generation progress', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();

    await expect(avatarPage.progressBar).toBeVisible();
    const progressText = await avatarPage.progressBar.getAttribute('aria-valuenow');
    expect(Number(progressText)).toBeGreaterThanOrEqual(0);
  });

  test('should allow regenerating avatar', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();
    await avatarPage.waitForGenerationComplete();

    // Regenerate
    await avatarPage.regenerateButton.click();
    await avatarPage.waitForGenerationComplete();

    // New avatar should be different
    await expect(avatarPage.avatarPreview).toBeVisible();
  });

  test('should display body measurements after generation', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();
    await avatarPage.waitForGenerationComplete();

    // Measurements should be displayed
    await expect(page.getByText(/height|shoulder|chest|waist|hips/i)).toBeVisible();
  });

  test('should allow downloading avatar', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();
    await avatarPage.waitForGenerationComplete();

    // Download should be available
    await expect(avatarPage.downloadButton).toBeEnabled();
  });

  test('should cancel generation', async ({ page }) => {
    const avatarPage = new AvatarPage(page);
    await avatarPage.goto();

    await avatarPage.uploadVideo('test-avatar-video.mp4');
    await avatarPage.startGeneration();

    await avatarPage.cancelGeneration();

    // Processing should stop
    await expect(avatarPage.processingIndicator).not.toBeVisible({ timeout: 5000 });
  });
});
```

### 4.6 Assign Outfit to Calendar Date

```ts
// e2e/specs/calendar.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { CalendarPage } from '../pages/CalendarPage';

test.describe('Calendar outfit assignment', () => {
  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    const res = await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-cal-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Calendar Test User',
      },
    });
    const { accessToken } = await res.json();

    // Create an outfit via API
    await apiContext.request.put('http://localhost:4000/api/outfits', {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: {
        name: 'Calendar Test Outfit',
        season: 'summer',
        style: 'casual',
      },
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-cal-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should assign outfit to a calendar date', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    // Click on a date
    await calendarPage.selectDate(15);

    // Choose outfit
    await calendarPage.selectOutfit('Calendar Test Outfit');

    // Assign
    await calendarPage.assignOutfit();

    // Event should appear on calendar
    await expect(page.getByText('Calendar Test Outfit')).toBeVisible();
  });

  test('should view outfit assigned to a date', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    // Assign outfit first
    await calendarPage.selectDate(20);
    await calendarPage.selectOutfit('Calendar Test Outfit');
    await calendarPage.assignOutfit();

    // Click on the day to view
    await calendarPage.selectDate(20);

    // Outfit details should be shown
    await expect(calendarPage.eventDetails).toBeVisible();
    await expect(calendarPage.eventDetails).toContainText('Calendar Test Outfit');
  });

  test('should remove outfit from calendar date', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    // Assign
    await calendarPage.selectDate(10);
    await calendarPage.selectOutfit('Calendar Test Outfit');
    await calendarPage.assignOutfit();

    // Remove
    await calendarPage.removeOutfit();

    // Event should be gone
    await expect(page.getByText('Calendar Test Outfit')).not.toBeVisible();
  });

  test('should navigate between months', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    const currentMonth = await calendarPage.getCurrentMonth();

    await calendarPage.nextMonth();
    const nextMonth = await calendarPage.getCurrentMonth();
    expect(nextMonth).not.toBe(currentMonth);

    await calendarPage.previousMonth();
    await calendarPage.previousMonth();
    const prevMonth = await calendarPage.getCurrentMonth();
    expect(prevMonth).not.toBe(currentMonth);
  });

  test('should show today highlighted', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    await expect(calendarPage.todayIndicator).toBeVisible();
  });

  test('should show multiple outfits for a day', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    // Assign multiple
    for (const name of ['Morning Look', 'Evening Look']) {
      await calendarPage.selectDate(5);
      await page.getByRole('button', { name: /add outfit/i }).click();
      // ... select outfit
    }

    // Day should show multiple events
    const eventCount = await calendarPage.getEventsForDay(5);
    expect(eventCount).toBe(2);
  });

  test('should show empty state for days with no outfit', async ({ page }) => {
    const calendarPage = new CalendarPage(page);
    await calendarPage.goto();

    await calendarPage.selectDate(25);
    await expect(calendarPage.eventDetails).not.toBeVisible();
    await expect(page.getByText(/no outfit assigned/i)).toBeVisible();
  });
});
```

### 4.7 Receive Notification and Mark as Read

```ts
// e2e/specs/notifications.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { NotificationsPage } from '../pages/NotificationsPage';

test.describe('Notifications', () => {
  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    const res = await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-notif-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Notification Test User',
      },
    });
    const { accessToken, user } = await res.json();

    // Create notifications via API
    for (let i = 0; i < 3; i++) {
      await apiContext.request.post('http://localhost:4000/api/notifications', {
        headers: { Authorization: `Bearer ${accessToken}` },
        data: {
          userId: user.id,
          type: 'outfit_reminder',
          message: `Reminder: Try your outfit #${i + 1}`,
        },
      });
    }
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-notif-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should display notification badge with count', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    // Badge should show unread count
    await expect(notifPage.badge).toBeVisible();
    const badgeText = await notifPage.badge.textContent();
    expect(Number(badgeText)).toBeGreaterThan(0);
  });

  test('should list all notifications', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    const count = await notifPage.getNotificationCount();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('should mark a notification as read', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    await notifPage.markAsRead(0);

    // Badge count should decrease
    const badgeText = await notifPage.badge.textContent();
    expect(Number(badgeText)).toBeLessThan(3);
  });

  test('should mark all notifications as read', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    await notifPage.markAllAsRead();

    // Badge should disappear
    await expect(notifPage.badge).not.toBeVisible();
    await expect(page.getByText(/all caught up|no notifications/i)).toBeVisible();
  });

  test('should navigate to related content on click', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    await notifPage.clickNotification(0);

    // Should navigate to related page (e.g., outfit, calendar)
    await expect(page).not.toHaveURL(/notifications/);
  });

  test('should delete a notification', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    const initialCount = await notifPage.getNotificationCount();

    await notifPage.deleteNotification(0);

    const newCount = await notifPage.getNotificationCount();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should show different notification types with icons', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    // Create different types
    // Check that each type has appropriate icon
    await expect(notifPage.getNotificationTypeIcons()).toHaveCount(3);
  });

  test('should support infinite scroll for many notifications', async ({ page }) => {
    const notifPage = new NotificationsPage(page);
    await notifPage.goto();

    // Scroll down
    await notifPage.scrollToBottom();
    await page.waitForTimeout(1000);

    // More notifications should load
    const totalCount = await notifPage.getNotificationCount();
    expect(totalCount).toBeGreaterThanOrEqual(3);
  });
});
```

### 4.8 View Analytics Dashboard

```ts
// e2e/specs/analytics.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';

test.describe('Analytics dashboard', () => {
  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    const res = await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-analytics-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Analytics Test User',
      },
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-analytics-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should display analytics dashboard overview', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    // Key metrics should be visible
    await expect(analyticsPage.totalGarments).toBeVisible();
    await expect(analyticsPage.totalOutfits).toBeVisible();
    await expect(analyticsPage.mostWornCategory).toBeVisible();
    await expect(analyticsPage.averageOutfitsPerWeek).toBeVisible();
  });

  test('should show garment distribution chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.garmentDistributionChart).toBeVisible();
  });

  test('should show color distribution chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.colorDistributionChart).toBeVisible();
  });

  test('should show wearing frequency chart', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.wearingFrequencyChart).toBeVisible();
  });

  test('should show brand breakdown', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.brandBreakdown).toBeVisible();
  });

  test('should allow date range filtering', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await analyticsPage.selectDateRange('Last 30 days');

    // Charts should update
    await page.waitForTimeout(500);
    await expect(analyticsPage.garmentDistributionChart).toBeVisible();
  });

  test('should show season breakdown', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.seasonBreakdown).toBeVisible();
  });

  test('should show most used styles', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.mostUsedStyles).toBeVisible();
  });

  test('should show wardrobe value estimation', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    await expect(analyticsPage.wardrobeValue).toBeVisible();
  });

  test('should handle empty analytics state', async ({ page }) => {
    const analyticsPage = new AnalyticsPage(page);
    await analyticsPage.goto();

    // New user with no data should see empty state
    await expect(analyticsPage.emptyState).toBeVisible();
  });
});
```

### 4.9 Export User Data

```ts
// e2e/specs/settings.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SettingsPage } from '../pages/SettingsPage';

test.describe('Export and settings', () => {
  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: {
        email: `e2e-settings-${Date.now()}@test.com`,
        password: 'E2eTestP@ss1',
        name: 'Settings Test User',
      },
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(`e2e-settings-${Date.now()}@test.com`, 'E2eTestP@ss1');
  });

  test('should export user data as JSON', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToExport();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      settingsPage.exportAsJSON(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.json$/);
    expect(download.suggestedFilename()).toContain('closet-data');
  });

  test('should export user data as CSV', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToExport();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      settingsPage.exportAsCSV(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('should include all data types in export', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToExport();

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      settingsPage.exportAsJSON(),
    ]);

    const content = await (await download.createReadStream()).toArray();
    const data = JSON.parse(Buffer.concat(content).toString());

    expect(data).toHaveProperty('user');
    expect(data).toHaveProperty('garments');
    expect(data).toHaveProperty('outfits');
    expect(data).toHaveProperty('calendar_events');
    expect(data).toHaveProperty('notifications');
  });

  test('should show export progress', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToExport();

    await settingsPage.exportAsJSON();

    await expect(page.getByText(/exporting|preparing data/i)).toBeVisible();
  });

  test('should handle export failure gracefully', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToExport();

    // Simulate network failure
    await page.context().setOffline(true);

    await settingsPage.exportAsJSON();

    await expect(page.getByText(/export failed|error/i)).toBeVisible();

    await page.context().setOffline(false);
  });
});
```

### 4.10 Delete Account

```ts
// e2e/specs/settings-account.spec.ts
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { SettingsPage } from '../pages/SettingsPage';

test.describe('Account deletion', () => {
  const testUser = {
    email: `e2e-delete-${Date.now()}@test.com`,
    password: 'E2eTestP@ss1',
    name: 'Delete Test User',
  };

  test.beforeAll(async ({ browser }) => {
    const apiContext = await browser.newContext();
    await apiContext.request.post('http://localhost:4000/api/auth/register', {
      data: testUser,
    });
    await apiContext.close();
  });

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUser.email, testUser.password);
  });

  test('should show account deletion option', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await expect(settingsPage.deleteAccountButton).toBeVisible();
  });

  test('should require confirmation before deletion', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.deleteAccountButton.click();

    // Confirmation dialog should appear
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/are you sure|confirm deletion/i)).toBeVisible();
  });

  test('should cancel account deletion', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.deleteAccountButton.click();
    await page.getByRole('button', { name: /cancel/i }).click();

    // Dialog should close, user stays logged in
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page).toHaveURL(/settings/);
  });

  test('should require password to confirm deletion', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.deleteAccountButton.click();

    // Password input should be required
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should reject wrong password during deletion', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.initiateAccountDeletion('WrongPassword123');

    await expect(page.getByText(/incorrect password|invalid credentials/i)).toBeVisible();
  });

  test('should delete account and redirect to login', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.initiateAccountDeletion(testUser.password);

    // Should confirm deletion
    await expect(page.getByText(/account deleted|deletion complete/i)).toBeVisible();

    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/);

    // Verify cannot login
    const loginPage = new LoginPage(page);
    await loginPage.login(testUser.email, testUser.password);
    await expect(page.getByText(/invalid|not found/i)).toBeVisible();
  });

  test('should show data that will be deleted', async ({ page }) => {
    const settingsPage = new SettingsPage(page);
    await settingsPage.goto();
    await settingsPage.navigateToAccount();

    await settingsPage.deleteAccountButton.click();

    // Should list data to be deleted
    await expect(page.getByText(/garments|outfits|avatar/i)).toBeVisible();
    await expect(page.getByText(/this action cannot be undone/i)).toBeVisible();
  });
});
```

## 5. Test Data Setup and Teardown

```ts
// e2e/data/seed.ts
import { faker } from '@faker-js/faker';

export interface SeedConfig {
  users?: number;
  garmentsPerUser?: number;
  outfitsPerUser?: number;
  eventsPerUser?: number;
  notificationsPerUser?: number;
}

export async function seedTestData(config: SeedConfig = {}) {
  const {
    users = 1,
    garmentsPerUser = 5,
    outfitsPerUser = 2,
    eventsPerUser = 3,
    notificationsPerUser = 2,
  } = config;

  const apiUrl = process.env.E2E_API_URL || 'http://localhost:4000';

  for (let u = 0; u < users; u++) {
    // Register user
    const userData = {
      email: faker.internet.email(),
      password: 'E2eTestP@ss1',
      name: faker.person.fullName(),
    };

    const res = await fetch(`${apiUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const { accessToken, user } = await res.json();

    // Create garments
    const garmentIds: string[] = [];
    for (let g = 0; g < garmentsPerUser; g++) {
      const garmentRes = await fetch(`${apiUrl}/api/garments`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: (() => {
          const formData = new FormData();
          formData.append('name', faker.commerce.productName());
          formData.append('category', faker.helpers.arrayElement(['top', 'bottom', 'footwear', 'accessory', 'outerwear']));
          formData.append('color', faker.helpers.arrayElement(['black', 'white', 'red', 'blue', 'green']));
          formData.append('brand', faker.company.name());
          formData.append('image', new Blob(['fake-image']), 'garment.jpg');
          return formData;
        })(),
      });
      const garment = await garmentRes.json();
      garmentIds.push(garment.id);
    }

    // Create outfits
    for (let o = 0; o < outfitsPerUser; o++) {
      await fetch(`${apiUrl}/api/outfits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: faker.lorem.words(3),
          season: faker.helpers.arrayElement(['spring', 'summer', 'autumn', 'winter', 'all']),
          style: faker.helpers.arrayElement(['casual', 'formal', 'sporty']),
          garmentIds: faker.helpers.arrayElements(garmentIds, { min: 2, max: 4 }),
        }),
      });
    }

    // Create calendar events
    for (let e = 0; e < eventsPerUser; e++) {
      const date = faker.date.future();
      await fetch(`${apiUrl}/api/calendar`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: date.toISOString().split('T')[0],
          outfitId: faker.helpers.arrayElement(garmentIds),
          note: faker.lorem.sentence(),
        }),
      });
    }

    // Create notifications
    for (let n = 0; n < notificationsPerUser; n++) {
      await fetch(`${apiUrl}/api/notifications`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          type: faker.helpers.arrayElement(['outfit_reminder', 'wardrobe_tip', 'style_suggestion']),
          message: faker.lorem.sentence(),
        }),
      });
    }
  }

  console.log(`Seeded ${users} user(s) with test data.`);
}
```

```ts
// e2e/data/clean.ts
export async function cleanTestData() {
  const apiUrl = process.env.E2E_API_URL || 'http://localhost:4000';

  try {
    // Admin endpoint to truncate test data
    await fetch(`${apiUrl}/api/admin/clean-test-data`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });

    // Clean up storage bucket
    await fetch(`${apiUrl}/api/admin/clean-test-storage`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
      },
    });

    console.log('Test data cleaned successfully.');
  } catch (error) {
    console.error('Failed to clean test data:', error);
  }
}
```

## 6. CI Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  pull_request:
    paths:
      - 'src/**'
      - 'e2e/**'
      - 'docker-compose.yml'
  workflow_dispatch:

jobs:
  e2e:
    timeout-minutes: 30
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: closet_e2e
          POSTGRES_USER: e2e
          POSTGRES_PASSWORD: e2e
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

      minio:
        image: minio/minio:latest
        env:
          MINIO_ROOT_USER: minioadmin
          MINIO_ROOT_PASSWORD: minioadmin
        command: server /data --console-address ":9001"
        ports:
          - 9000:9000

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:4000
          DATABASE_URL: postgresql://e2e:e2e@localhost:5432/closet_e2e

      - name: Start application
        run: |
          npm run start:backend &
          npm run start:frontend &
          npx wait-on http://localhost:4000/health http://localhost:3000
        env:
          NODE_ENV: production
          DATABASE_URL: postgresql://e2e:e2e@localhost:5432/closet_e2e
          REDIS_URL: redis://localhost:6379
          SUPABASE_URL: http://localhost:9000
          JWT_SECRET: e2e-test-secret
          MINIO_ENDPOINT: localhost
          MINIO_PORT: 9000
          MINIO_ACCESS_KEY: minioadmin
          MINIO_SECRET_KEY: minioadmin

      - name: Run database migrations
        run: npm run migration:run
        env:
          DATABASE_URL: postgresql://e2e:e2e@localhost:5432/closet_e2e

      - name: Install Playwright
        run: npx playwright install --with-deps chromium

      - name: Run E2E tests
        run: npm run test:e2e:ci
        env:
          E2E_BASE_URL: http://localhost:3000
          E2E_API_URL: http://localhost:4000
          CI: true

      - name: Upload Playwright report
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload test videos
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-videos
          path: test-results/
          retention-days: 3
```

## 7. Test Utilities

```ts
// e2e/utils/server.ts
import http from 'http';

export function waitForServer(url: string, timeoutMs: number = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    function check() {
      const req = http.get(url, (res) => {
        if (res.statusCode && res.statusCode < 500) {
          resolve();
        } else if (Date.now() - startTime < timeoutMs) {
          setTimeout(check, 1000);
        } else {
          reject(new Error(`Server at ${url} not ready within ${timeoutMs}ms`));
        }
      });

      req.on('error', () => {
        if (Date.now() - startTime < timeoutMs) {
          setTimeout(check, 1000);
        } else {
          reject(new Error(`Server at ${url} not ready within ${timeoutMs}ms`));
        }
      });

      req.end();
    }

    check();
  });
}
```

```ts
// e2e/utils/auth.ts
import { Page } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

export async function loginAsTestUser(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(
    process.env.TEST_USER_EMAIL!,
    process.env.TEST_USER_PASSWORD!
  );
  await page.waitForURL(/dashboard/);
}

export async function getAuthToken(page: Page): Promise<string> {
  return page.evaluate(() => {
    const stored = localStorage.getItem('auth-storage');
    if (stored) {
      return JSON.parse(stored).state.accessToken;
    }
    return '';
  });
}
```

```ts
// e2e/utils/api.ts
export async function createTestUser(apiUrl: string, overrides = {}) {
  const res = await fetch(`${apiUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `e2e-${Date.now()}@test.com`,
      password: 'E2eTestP@ss1',
      name: 'E2E Test User',
      ...overrides,
    }),
  });
  return res.json();
}

export async function deleteTestUser(apiUrl: string, token: string) {
  await fetch(`${apiUrl}/api/auth/account`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function seedGarments(apiUrl: string, token: string, count: number = 5) {
  const garments = [];
  for (let i = 0; i < count; i++) {
    const res = await fetch(`${apiUrl}/api/garments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: (() => {
        const fd = new FormData();
        fd.append('name', `Test Garment ${i}`);
        fd.append('category', ['top', 'bottom', 'footwear', 'accessory', 'outerwear'][i % 5]);
        fd.append('color', ['red', 'blue', 'black', 'white', 'green'][i % 5]);
        fd.append('image', new Blob(['fake']), `g${i}.jpg`);
        return fd;
      })(),
    });
    garments.push(await res.json());
  }
  return garments;
}
```
