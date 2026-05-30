# Frontend Testing — Closet Inteligente Digital

## 1. React Testing Library Setup

### 1.1 Dependencies

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/react": "^14.x",
    "@testing-library/user-event": "^14.x",
    "@testing-library/react-hooks": "^8.x",
    "jest-axe": "^8.x",
    "msw": "^2.x",
    "jest-environment-jsdom": "^29.x",
    "identity-obj-proxy": "^3.x",
    "whatwg-fetch": "^3.x"
  }
}
```

### 1.2 Jest configuration

```ts
// jest.frontend.config.ts
import type { Config } from 'jest';
import nextJest from 'next/jest';

const createJestConfig = nextJest({ dir: './' });

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test/__mocks__/fileMock.js',
    '^three$': '<rootDir>/test/__mocks__/three.js',
    '^@react-three/fiber$': '<rootDir>/test/__mocks__/react-three-fiber.js',
    '^@react-three/drei$': '<rootDir>/test/__mocks__/react-three-drei.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/layout.tsx',
  ],
  coverageThreshold: {
    global: { branches: 80, functions: 80, lines: 80, statements: 80 },
    './src/components/ui/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/features/auth/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
    './src/stores/**': { branches: 90, functions: 90, lines: 90, statements: 90 },
  },
  testMatch: ['**/__tests__/**/*.{ts,tsx}', '**/*.{spec,test}.{ts,tsx}'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
};

export default createJestConfig(config);
```

### 1.3 Global setup file

```ts
// jest.setup.ts
import '@testing-library/jest-dom';
import { toHaveNoViolations } from 'jest-axe';
import { TextEncoder, TextDecoder } from 'util';

expect.extend(toHaveNoViolations);

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback) {}

  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
  takeRecords = jest.fn().mockReturnValue([]);
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  constructor(private callback: ResizeObserverCallback) {}
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

Object.defineProperty(global, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// Mock scrollTo
window.scrollTo = jest.fn();

// Suppress console errors for specific intentional error tests
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (/Warning.*not wrapped in act/.test(args[0])) return;
  originalConsoleError.call(console, ...args);
};
```

### 1.4 Custom render utility

```ts
// test/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  route?: string;
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // suppress query error logging in tests
    },
  });
}

function AllTheProviders({
  children,
  queryClient = createTestQueryClient(),
}: {
  children: React.ReactNode;
  queryClient?: QueryClient;
}) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  const { queryClient, ...renderOptions } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders queryClient={queryClient}>{children}</AllTheProviders>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export * from '@testing-library/react';
export { customRender as render };
export { createTestQueryClient };
```

## 2. Component Testing Patterns

### 2.1 Basic structure

```tsx
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';

describe('ComponentName', () => {
  it('renders with default props', () => {
    render(<ComponentName />);
    expect(screen.getByRole('heading', { name: /expected/i })).toBeInTheDocument();
  });

  it('responds to user interaction', async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();

    render(<ComponentName onAction={onAction} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('displays loading state', () => {
    render(<ComponentName isLoading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays error state', () => {
    render(<ComponentName error="Something went wrong" />);
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i);
  });

  it('displays empty state', () => {
    render(<ComponentName items={[]} />);
    expect(screen.getByText(/no items/i)).toBeInTheDocument();
  });
});
```

### 2.2 User interaction patterns

```tsx
it('handles form input correctly', async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();

  render(<LoginForm onSubmit={onSubmit} />);

  const emailInput = screen.getByLabelText(/email/i);
  const passwordInput = screen.getByLabelText(/password/i);

  await user.type(emailInput, 'user@example.com');
  await user.type(passwordInput, 'mypassword');
  await user.click(screen.getByRole('button', { name: /log in/i }));

  expect(onSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'mypassword',
  });
});

it('validates required fields on blur', async () => {
  const user = userEvent.setup();

  render(<LoginForm />);

  const emailInput = screen.getByLabelText(/email/i);
  await user.click(emailInput);
  await user.tab(); // blur

  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

## 3. Hook Testing with renderHook

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAuth hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with unauthenticated state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('sets user after successful login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toMatchObject({
      email: 'test@example.com',
    });
  });

  it('clears user after logout', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('refreshes token automatically', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    // Simulate token expiry
    await act(async () => {
      await result.current.refreshToken();
    });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('throws on login failure', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(
        result.current.login({ email: 'wrong@example.com', password: 'bad' })
      ).rejects.toThrow();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });

  it('rejects login for inactive accounts', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await expect(
        result.current.login({ email: 'inactive@example.com', password: 'password123' })
      ).rejects.toThrow(/account is inactive/i);
    });
  });

  it('persists auth state to localStorage', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password123' });
    });

    const stored = JSON.parse(localStorage.getItem('auth-storage')!);
    expect(stored.state.user.email).toBe('test@example.com');
  });

  it('restores auth state from localStorage on mount', async () => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user: { email: 'stored@example.com', id: '1' }, isAuthenticated: true },
      version: 0,
    }));

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('stored@example.com');
  });
});
```

## 4. Store Testing (Zustand)

### 4.1 Testing state mutations

```tsx
import { useGarmentStore } from '@/stores/garment-store';
import { act } from '@testing-library/react';

describe('useGarmentStore', () => {
  beforeEach(() => {
    act(() => {
      useGarmentStore.getState().reset();
    });
  });

  it('starts with empty garments array', () => {
    const state = useGarmentStore.getState();
    expect(state.garments).toEqual([]);
    expect(state.selectedGarment).toBeNull();
    expect(state.filter).toEqual({ category: 'all', color: 'all' });
  });

  it('adds a garment to the store', () => {
    const garment = {
      id: 'g1',
      name: 'Blue Shirt',
      category: 'top',
      color: 'blue',
      imageUrl: 'https://example.com/shirt.jpg',
    };

    act(() => {
      useGarmentStore.getState().addGarment(garment);
    });

    const state = useGarmentStore.getState();
    expect(state.garments).toHaveLength(1);
    expect(state.garments[0]).toEqual(garment);
  });

  it('adds multiple garments', () => {
    const garments = [
      { id: 'g1', name: 'Shirt 1', category: 'top' },
      { id: 'g2', name: 'Shirt 2', category: 'top' },
      { id: 'g3', name: 'Pants 1', category: 'bottom' },
    ];

    act(() => {
      useGarmentStore.getState().setGarments(garments);
    });

    expect(useGarmentStore.getState().garments).toHaveLength(3);
  });

  it('updates a garment by id', () => {
    act(() => {
      useGarmentStore.getState().setGarments([
        { id: 'g1', name: 'Old Name', category: 'top', color: 'red' },
      ]);
    });

    act(() => {
      useGarmentStore.getState().updateGarment('g1', { name: 'New Name', color: 'blue' });
    });

    const updated = useGarmentStore.getState().garments[0];
    expect(updated.name).toBe('New Name');
    expect(updated.color).toBe('blue');
  });

  it('removes a garment by id', () => {
    act(() => {
      useGarmentStore.getState().setGarments([
        { id: 'g1', name: 'To Remove' },
        { id: 'g2', name: 'Keep' },
      ]);
    });

    act(() => {
      useGarmentStore.getState().removeGarment('g1');
    });

    expect(useGarmentStore.getState().garments).toHaveLength(1);
    expect(useGarmentStore.getState().garments[0].id).toBe('g2');
  });

  it('sets selected garment', () => {
    const garment = { id: 'g1', name: 'Selected' };

    act(() => {
      useGarmentStore.getState().selectGarment(garment);
    });

    expect(useGarmentStore.getState().selectedGarment).toEqual(garment);
  });

  it('clears selected garment', () => {
    act(() => {
      useGarmentStore.getState().selectGarment({ id: 'g1', name: 'Selected' });
    });

    act(() => {
      useGarmentStore.getState().clearSelection();
    });

    expect(useGarmentStore.getState().selectedGarment).toBeNull();
  });

  it('throws when updating non-existent garment', () => {
    expect(() => {
      useGarmentStore.getState().updateGarment('non-existent', { name: 'Ghost' });
    }).toThrow(/garment not found/i);
  });

  it('handles bulk operations', () => {
    const garments = Array.from({ length: 100 }, (_, i) => ({
      id: `g${i}`,
      name: `Garment ${i}`,
      category: 'top' as const,
      color: 'blue',
    }));

    act(() => {
      useGarmentStore.getState().setGarments(garments);
    });

    act(() => {
      useGarmentStore.getState().removeGarments(garments.slice(0, 50).map(g => g.id));
    });

    expect(useGarmentStore.getState().garments).toHaveLength(50);
  });
});
```

### 4.2 Testing selectors

```tsx
describe('useGarmentStore selectors', () => {
  beforeEach(() => {
    act(() => {
      useGarmentStore.getState().setGarments([
        { id: 'g1', name: 'Red Top', category: 'top', color: 'red', favorite: false },
        { id: 'g2', name: 'Blue Top', category: 'top', color: 'blue', favorite: true },
        { id: 'g3', name: 'Black Pants', category: 'bottom', color: 'black', favorite: false },
        { id: 'g4', name: 'White Shoes', category: 'footwear', color: 'white', favorite: true },
      ]);
    });
  });

  it('selects garments by category', () => {
    const tops = useGarmentStore.getState().getGarmentsByCategory('top');
    expect(tops).toHaveLength(2);
    expect(tops.every(g => g.category === 'top')).toBe(true);
  });

  it('selects garments by color', () => {
    const red = useGarmentStore.getState().getGarmentsByColor('red');
    expect(red).toHaveLength(1);
    expect(red[0].name).toBe('Red Top');
  });

  it('selects favorite garments', () => {
    const favorites = useGarmentStore.getState().getFavoriteGarments();
    expect(favorites).toHaveLength(2);
    expect(favorites.every(g => g.favorite)).toBe(true);
  });

  it('selects filtered garments', () => {
    act(() => {
      useGarmentStore.getState().setFilter({ category: 'top', color: 'all' });
    });

    const filtered = useGarmentStore.getState().getFilteredGarments();
    expect(filtered).toHaveLength(2);
    expect(filtered.every(g => g.category === 'top')).toBe(true);
  });

  it('combines multiple filters', () => {
    act(() => {
      useGarmentStore.getState().setFilter({ category: 'top', color: 'blue' });
    });

    const filtered = useGarmentStore.getState().getFilteredGarments();
    expect(filtered).toHaveLength(1);
    expect(filtered[0].name).toBe('Blue Top');
  });

  it('returns all garments when no filter is set', () => {
    act(() => {
      useGarmentStore.getState().setFilter({ category: 'all', color: 'all' });
    });

    expect(useGarmentStore.getState().getFilteredGarments()).toHaveLength(4);
  });

  it('counts garments by category', () => {
    const counts = useGarmentStore.getState().getCategoryCounts();
    expect(counts).toEqual({ top: 2, bottom: 1, footwear: 1, accessory: 0, outerwear: 0 });
  });
});
```

### 4.3 Testing persistence

```tsx
describe('useGarmentStore persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists store to localStorage', () => {
    act(() => {
      useGarmentStore.getState().addGarment({ id: 'g1', name: 'Persisted', category: 'top' });
    });

    const stored = JSON.parse(localStorage.getItem('garment-storage')!);
    expect(stored.state.garments).toHaveLength(1);
    expect(stored.state.garments[0].name).toBe('Persisted');
  });

  it('rehydrates from localStorage on initialization', () => {
    localStorage.setItem('garment-storage', JSON.stringify({
      state: {
        garments: [{ id: 'g1', name: 'Rehydrated', category: 'top' }],
        selectedGarment: null,
        filter: { category: 'all', color: 'all' },
      },
      version: 0,
    }));

    // Re-create the store to trigger rehydration
    const state = useGarmentStore.getState();
    expect(state.garments).toHaveLength(1);
    expect(state.garments[0].name).toBe('Rehydrated');
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('garment-storage', 'invalid-json');

    const state = useGarmentStore.getState();
    expect(state.garments).toEqual([]);
  });

  it('respects version field and migrates if needed', () => {
    localStorage.setItem('garment-storage', JSON.stringify({
      state: { garments: [], selectedGarment: null, filter: {} },
      version: 0,
    }));

    // Version matches, no migration
    expect(useGarmentStore.getState().filter).toBeDefined();
  });
});
```

## 5. TanStack Query Testing

### 5.1 Testing query hooks

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useGarments } from '@/hooks/queries/useGarments';

const server = setupServer(
  http.get('/api/garments', ({ request }) => {
    const url = new URL(request.url);
    const page = url.searchParams.get('page') ?? '1';

    return HttpResponse.json({
      data: [
        { id: 'g1', name: 'Shirt A', category: 'top', color: 'blue' },
        { id: 'g2', name: 'Shirt B', category: 'top', color: 'red' },
      ],
      meta: { total: 2, page: Number(page), limit: 20 },
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useGarments query hook', () => {
  it('returns garment data on success', async () => {
    const { result } = renderHook(() => useGarments({ page: 1, limit: 20 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(2);
    expect(result.current.data?.meta.total).toBe(2);
  });

  it('shows loading state initially', () => {
    const { result } = renderHook(() => useGarments({ page: 1, limit: 20 }), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
  });

  it('reflects error state on API failure', async () => {
    server.use(
      http.get('/api/garments', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    const { result } = renderHook(() => useGarments({ page: 1, limit: 20 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });

  it('refetches when query key changes', async () => {
    let page = 1;
    const { result, rerender } = renderHook(
      () => useGarments({ page, limit: 20 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    page = 2;
    rerender();

    await waitFor(() => expect(result.current.data?.meta.page).toBe(2));
  });

  it('handles empty response', async () => {
    server.use(
      http.get('/api/garments', () => {
        return HttpResponse.json({ data: [], meta: { total: 0, page: 1, limit: 20 } });
      })
    );

    const { result } = renderHook(() => useGarments({ page: 1, limit: 20 }), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.data).toEqual([]);
    expect(result.current.data?.meta.total).toBe(0);
  });
});
```

### 5.2 Testing mutation hooks

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useCreateGarment } from '@/hooks/mutations/useCreateGarment';

const server = setupServer(
  http.post('/api/garments', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      id: 'new-garment',
      ...body,
      imageUrl: 'https://example.com/new.jpg',
    }, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCreateGarment mutation hook', () => {
  it('creates a garment and returns the result', async () => {
    const { result } = renderHook(() => useCreateGarment(), { wrapper: createWrapper() });

    result.current.mutate({
      name: 'New Shirt',
      category: 'top',
      color: 'blue',
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      id: 'new-garment',
      name: 'New Shirt',
    });
  });

  it('shows loading state during mutation', () => {
    const { result } = renderHook(() => useCreateGarment(), { wrapper: createWrapper() });

    result.current.mutate({
      name: 'Slow Upload',
      category: 'top',
      color: 'red',
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    });

    expect(result.current.isPending).toBe(true);
  });

  it('handles mutation error', async () => {
    server.use(
      http.post('/api/garments', () => {
        return HttpResponse.json({ message: 'Validation failed' }, { status: 400 });
      })
    );

    const { result } = renderHook(() => useCreateGarment(), { wrapper: createWrapper() });

    result.current.mutate({
      name: '',
      category: 'invalid',
      color: '',
      file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
```

### 5.3 Testing cache invalidation

```tsx
it('invalidates garment list after creation', async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  // Pre-populate the cache
  queryClient.setQueryData(['garments', { page: 1 }], {
    data: [{ id: 'old' }],
    meta: { total: 1 },
  });

  const { result } = renderHook(() => useCreateGarment(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  result.current.mutate({
    name: 'New',
    category: 'top',
    color: 'blue',
    file: new File(['test'], 'test.jpg', { type: 'image/jpeg' }),
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));

  // The old cache should be invalidated
  const cached = queryClient.getQueryData(['garments', { page: 1 }]);
  expect(cached).toBeUndefined();
});
```

## 6. Page Integration Tests

```tsx
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import GarmentLibraryPage from '@/app/wardrobe/page';

const server = setupServer(
  http.get('/api/garments', () => {
    return HttpResponse.json({
      data: [
        { id: 'g1', name: 'Blue Shirt', category: 'top', color: 'blue', imageUrl: '/img1.jpg', favorite: false },
        { id: 'g2', name: 'Red Shoes', category: 'footwear', color: 'red', imageUrl: '/img2.jpg', favorite: true },
        { id: 'g3', name: 'Black Pants', category: 'bottom', color: 'black', imageUrl: '/img3.jpg', favorite: false },
      ],
      meta: { total: 3, page: 1, limit: 20 },
    });
  }),

  http.delete('/api/garments/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.patch('/api/garments/:id', () => {
    return HttpResponse.json({ id: 'g1', name: 'Blue Shirt', category: 'top', color: 'blue', favorite: true });
  }),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GarmentLibraryPage integration', () => {
  it('renders the garment list from API', async () => {
    render(<GarmentLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText('Blue Shirt')).toBeInTheDocument();
      expect(screen.getByText('Red Shoes')).toBeInTheDocument();
      expect(screen.getByText('Black Pants')).toBeInTheDocument();
    });
  });

  it('filters garments by category', async () => {
    const user = userEvent.setup();
    render(<GarmentLibraryPage />);

    await waitFor(() => expect(screen.getByText('Blue Shirt')).toBeInTheDocument());

    await user.click(screen.getByRole('combobox', { name: /category/i }));
    await user.click(screen.getByRole('option', { name: /footwear/i }));

    await waitFor(() => {
      expect(screen.queryByText('Blue Shirt')).not.toBeInTheDocument();
      expect(screen.getByText('Red Shoes')).toBeInTheDocument();
      expect(screen.queryByText('Black Pants')).not.toBeInTheDocument();
    });
  });

  it('toggles favorite status', async () => {
    const user = userEvent.setup();
    render(<GarmentLibraryPage />);

    await waitFor(() => expect(screen.getByText('Blue Shirt')).toBeInTheDocument());

    const favButtons = screen.getAllByRole('button', { name: /favorite/i });
    await user.click(favButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/added to favorites/i)).toBeInTheDocument();
    });
  });

  it('deletes a garment', async () => {
    const user = userEvent.setup();
    render(<GarmentLibraryPage />);

    await waitFor(() => expect(screen.getByText('Blue Shirt')).toBeInTheDocument());

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    // Confirm dialog
    await user.click(screen.getByRole('button', { name: /confirm/i }));

    await waitFor(() => {
      expect(screen.queryByText('Blue Shirt')).not.toBeInTheDocument();
      expect(screen.getByText(/garment deleted/i)).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching', () => {
    render(<GarmentLibraryPage />);

    expect(screen.getByTestId('garment-list-skeleton')).toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/garments', () => {
        return HttpResponse.json({ message: 'Internal server error' }, { status: 500 });
      })
    );

    render(<GarmentLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load garments/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retries after error', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/garments', () => {
        attempts++;
        if (attempts === 1) {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        }
        return HttpResponse.json({
          data: [{ id: 'g1', name: 'Retried Garment', category: 'top', color: 'blue' }],
          meta: { total: 1 },
        });
      })
    );

    const user = userEvent.setup();
    render(<GarmentLibraryPage />);

    await waitFor(() => expect(screen.getByText(/failed to load garments/i)).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Retried Garment')).toBeInTheDocument();
    });
  });

  it('shows empty state when no garments exist', async () => {
    server.use(
      http.get('/api/garments', () => {
        return HttpResponse.json({ data: [], meta: { total: 0 } });
      })
    );

    render(<GarmentLibraryPage />);

    await waitFor(() => {
      expect(screen.getByText(/your wardrobe is empty/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: /add your first garment/i })).toBeInTheDocument();
  });
});
```

## 7. Accessibility Testing with jest-axe

```tsx
import { render } from '@/test/utils/test-utils';
import { axe } from 'jest-axe';

describe('[Accessibility] Button', () => {
  it('has no violations in default state', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations in disabled state', async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations in loading state', async () => {
    const { container } = render(<Button isLoading>Loading</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('[Accessibility] GarmentCard', () => {
  const garment = {
    id: 'g1',
    name: 'Blue Shirt',
    category: 'top',
    color: 'blue',
    imageUrl: 'https://example.com/shirt.jpg',
  };

  it('has no violations', async () => {
    const { container } = render(<GarmentCard garment={garment} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations in empty state', async () => {
    const { container } = render(<GarmentCard garment={null} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has no violations when interactive', async () => {
    const { container } = render(<GarmentCard garment={garment} onClick={jest.fn()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('[Accessibility] LoginPage', () => {
  it('has no violations', async () => {
    const { container } = render(<LoginPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('[Accessibility] OutfitBuilder', () => {
  it('has no violations', async () => {
    const { container } = render(<OutfitBuilder />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## 8. Snapshot Testing Policy

**When to use**:
- Stable presentational components that rarely change (e.g., `Button`, `Badge`, `Skeleton`).
- Large data visualizations where manual assertion is impractical.
- Components that render deterministic output (no random IDs, no dates).

**When NOT to use**:
- Components with frequently changing business logic.
- Components that render dynamic data (API responses, user-specific content).
- Components with animations or time-based rendering.

**Guidelines**:
- Keep snapshots small and focused on a single component.
- Review snapshot diffs during PR review — if the diff is large, question whether the test is useful.
- Update snapshots with `jest --updateSnapshot` — never modify `.snap` files manually.

```tsx
describe('Button snapshot', () => {
  it('matches snapshot for primary variant', () => {
    const { container } = render(<Button variant="primary">Primary</Button>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot for danger variant', () => {
    const { container } = render(<Button variant="danger">Danger</Button>);
    expect(container).toMatchSnapshot();
  });

  it('matches snapshot with icon', () => {
    const { container } = render(<Button icon={<TestIcon />}>With Icon</Button>);
    expect(container).toMatchSnapshot();
  });
});
```

## 9. Testing Forms

```tsx
import { render, screen, waitFor } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { GarmentForm } from '@/components/forms/GarmentForm';

const server = setupServer(
  http.post('/api/garments', async ({ request }) => {
    const body = await request.json();
    if (body.name === 'error') {
      return HttpResponse.json({ message: 'Duplicate name' }, { status: 409 });
    }
    return HttpResponse.json({ id: 'new', ...body }, { status: 201 });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('GarmentForm', () => {
  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<GarmentForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/select a category/i)).toBeInTheDocument();
    expect(screen.getByText(/select a color/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('validates individual fields on blur', async () => {
    const user = userEvent.setup();
    render(<GarmentForm onSubmit={jest.fn()} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.click(nameInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.queryByText(/select a category/i)).not.toBeInTheDocument();
    });
  });

  it('submits valid form data', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<GarmentForm onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText(/name/i), 'Summer Dress');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /dress/i }));
    await user.click(screen.getByLabelText(/color/i));
    await user.click(screen.getByRole('option', { name: /yellow/i }));
    await user.type(screen.getByLabelText(/brand/i), 'Zara');
    await user.click(screen.getByLabelText(/size/i));
    await user.click(screen.getByRole('option', { name: /m/i }));

    // Upload a file
    const file = new File(['dummy'], 'dress.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload image/i);
    await user.upload(fileInput, file);

    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Summer Dress',
          category: 'dress',
          color: 'yellow',
          brand: 'Zara',
          size: 'M',
        })
      );
    });
  });

  it('displays server-side errors', async () => {
    const user = userEvent.setup();
    render(<GarmentForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/name/i), 'error');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /top/i }));
    await user.click(screen.getByLabelText(/color/i));
    await user.click(screen.getByRole('option', { name: /blue/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/duplicate name/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    render(<GarmentForm onSubmit={jest.fn()} />);

    await user.type(screen.getByLabelText(/name/i), 'Test Garment');
    await user.click(screen.getByLabelText(/category/i));
    await user.click(screen.getByRole('option', { name: /top/i }));
    await user.click(screen.getByLabelText(/color/i));
    await user.click(screen.getByRole('option', { name: /blue/i }));
    await user.click(screen.getByRole('button', { name: /save/i }));

    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled();
  });

  it('pre-populates fields for edit mode', () => {
    const existingGarment = {
      id: 'g1',
      name: 'Existing Shirt',
      category: 'top',
      color: 'red',
      brand: 'Nike',
      size: 'L',
    };

    render(<GarmentForm initialData={existingGarment} onSubmit={jest.fn()} />);

    expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Shirt');
    expect(screen.getByLabelText(/category/i)).toHaveTextContent(/top/i);
    expect(screen.getByLabelText(/color/i)).toHaveTextContent(/red/i);
    expect(screen.getByLabelText(/brand/i)).toHaveValue('Nike');
    expect(screen.getByLabelText(/size/i)).toHaveTextContent(/l/i);
  });

  it('allows clearing file selection', async () => {
    const user = userEvent.setup();
    render(<GarmentForm onSubmit={jest.fn()} />);

    const file = new File(['dummy'], 'test.png', { type: 'image/png' });
    const fileInput = screen.getByLabelText(/upload image/i);
    await user.upload(fileInput, file);

    expect(screen.getByText(/test.png/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remove/i }));

    expect(screen.queryByText(/test.png/i)).not.toBeInTheDocument();
  });
});
```

## 10. Testing Async Operations

```tsx
describe('AsyncOperations', () => {
  it('shows loading state during API call', async () => {
    render(<AsyncComponent />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('shows success state after API resolves', async () => {
    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByText(/data loaded successfully/i)).toBeInTheDocument();
    });

    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows error state when API fails', async () => {
    server.use(
      http.get('/api/data', () => {
        return HttpResponse.json({ message: 'Server error' }, { status: 500 });
      })
    );

    render(<AsyncComponent />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load data/i);
    });

    // Should still show retry button
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('transitions from loading to error to success on retry', async () => {
    let attempts = 0;
    server.use(
      http.get('/api/data', () => {
        attempts++;
        if (attempts < 2) {
          return HttpResponse.json({ message: 'Error' }, { status: 500 });
        }
        return HttpResponse.json({ data: 'Success' });
      })
    );

    const user = userEvent.setup();
    render(<AsyncComponent />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /retry/i }));
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/data loaded successfully/i)).toBeInTheDocument();
    });
  });

  it('cancels request on unmount', () => {
    const abortSpy = jest.fn();
    const originalAbort = AbortController.prototype.abort;
    AbortController.prototype.abort = abortSpy;

    const { unmount } = render(<AsyncComponent />);
    unmount();

    expect(abortSpy).toHaveBeenCalled();
    AbortController.prototype.abort = originalAbort;
  });

  it('does not update state after unmount', async () => {
    const { unmount } = render(<AsyncComponent />);
    unmount();

    // Should not throw
    await waitFor(() => {});
  });
});
```

## 11. Testing 3D Components (React Three Fiber)

```tsx
// test/__mocks__/react-three-fiber.js
const React = require('react');

module.exports = {
  Canvas: ({ children, ...props }: any) =>
    React.createElement('div', { 'data-testid': 'r3f-canvas', ...props }, children),
  useFrame: jest.fn(),
  useThree: jest.fn(() => ({
    camera: { position: { set: jest.fn() }, lookAt: jest.fn() },
    scene: { add: jest.fn(), remove: jest.fn() },
    gl: { render: jest.fn(), domElement: document.createElement('canvas') },
    size: { width: 1024, height: 768 },
  })),
  useLoader: jest.fn(() => ({})),
  useGraph: jest.fn(() => ({ nodes: {}, materials: {} })),
};

// test/__mocks__/three.js
module.exports = {
  Scene: jest.fn(() => ({ add: jest.fn(), remove: jest.fn() })),
  PerspectiveCamera: jest.fn(() => ({ position: { set: jest.fn() }, lookAt: jest.fn() })),
  WebGLRenderer: jest.fn(() => ({
    render: jest.fn(),
    setSize: jest.fn(),
    domElement: document.createElement('canvas'),
  })),
  Mesh: jest.fn(() => ({ position: { set: jest.fn() }, rotation: { set: jest.fn() } })),
  MeshStandardMaterial: jest.fn(),
  BoxGeometry: jest.fn(),
  SphereGeometry: jest.fn(),
  PlaneGeometry: jest.fn(),
  BufferGeometry: jest.fn(),
  Float32BufferAttribute: jest.fn(),
  Color: jest.fn(),
  AmbientLight: jest.fn(),
  DirectionalLight: jest.fn(),
  PointLight: jest.fn(),
  Group: jest.fn(() => ({ add: jest.fn(), children: [] })),
};
```

```tsx
import { render, screen } from '@/test/utils/test-utils';

describe('AvatarViewer (3D)', () => {
  it('renders the canvas', () => {
    render(<AvatarViewer avatarUrl="/avatars/test.glb" />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('passes correct props to Canvas', () => {
    render(<AvatarViewer avatarUrl="/avatars/test.glb" cameraPosition={[0, 1, 3]} />);
    const canvas = screen.getByTestId('r3f-canvas');
    expect(canvas).toHaveAttribute('cameraPosition');
  });

  it('shows loading fallback while model loads', () => {
    render(<AvatarViewer avatarUrl="/avatars/test.glb" />);
    expect(screen.getByText(/loading avatar/i)).toBeInTheDocument();
  });

  it('shows error state on failed model load', async () => {
    const { useLoader } = require('@react-three/fiber');
    (useLoader as jest.Mock).mockImplementationOnce(() => {
      throw new Error('Failed to load model');
    });

    render(<AvatarViewer avatarUrl="/avatars/broken.glb" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load avatar/i)).toBeInTheDocument();
    });
  });

  it('does not render canvas when no avatar URL is provided', () => {
    render(<AvatarViewer avatarUrl={null} />);
    expect(screen.queryByTestId('r3f-canvas')).not.toBeInTheDocument();
    expect(screen.getByText(/no avatar/i)).toBeInTheDocument();
  });
});
```

## 12. Testing Responsive Behavior

```tsx
describe('GarmentGrid responsive behavior', () => {
  const garments = Array.from({ length: 8 }, (_, i) => ({
    id: `g${i}`,
    name: `Garment ${i}`,
    category: 'top',
    color: 'blue',
    imageUrl: `/img${i}.jpg`,
  }));

  function setViewport(width: number) {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
    window.dispatchEvent(new Event('resize'));
  }

  it('shows 4 columns on desktop (> 1024px)', () => {
    setViewport(1440);
    render(<GarmentGrid garments={garments} />);
    const grid = screen.getByTestId('garment-grid');
    expect(grid).toHaveClass('grid-cols-4');
  });

  it('shows 3 columns on tablet (768-1024px)', () => {
    setViewport(900);
    render(<GarmentGrid garments={garments} />);
    const grid = screen.getByTestId('garment-grid');
    expect(grid).toHaveClass('grid-cols-3');
  });

  it('shows 2 columns on mobile (< 768px)', () => {
    setViewport(480);
    render(<GarmentGrid garments={garments} />);
    const grid = screen.getByTestId('garment-grid');
    expect(grid).toHaveClass('grid-cols-2');
  });

  it('shows 1 column on very small screens (< 400px)', () => {
    setViewport(360);
    render(<GarmentGrid garments={garments} />);
    const grid = screen.getByTestId('garment-grid');
    expect(grid).toHaveClass('grid-cols-1');
  });

  it('adjusts layout when window is resized', () => {
    setViewport(1440);
    render(<GarmentGrid garments={garments} />);
    const grid = screen.getByTestId('garment-grid');

    expect(grid).toHaveClass('grid-cols-4');

    setViewport(600);

    expect(grid).toHaveClass('grid-cols-2');
  });

  it('hides sidebar on mobile layout', () => {
    setViewport(480);
    render(<GarmentLibraryPage />);

    expect(screen.queryByTestId('sidebar')).not.toBeVisible();
  });

  it('shows hamburger menu on mobile', () => {
    setViewport(480);
    render(<GarmentLibraryPage />);

    expect(screen.getByRole('button', { name: /open menu/i })).toBeVisible();
  });

  it('shows sidebar on desktop', () => {
    setViewport(1440);
    render(<GarmentLibraryPage />);

    expect(screen.getByTestId('sidebar')).toBeVisible();
  });

  it('hides hamburger menu on desktop', () => {
    setViewport(1440);
    render(<GarmentLibraryPage />);

    expect(screen.queryByRole('button', { name: /open menu/i })).not.toBeInTheDocument();
  });
});
```

## 13. Example Test: Button Component

```tsx
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  // --- Rendering Variants ---

  it('renders with text content', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with children elements', () => {
    render(
      <Button>
        <span data-testid="icon" />
        With Icon
      </Button>
    );
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByText(/with icon/i)).toBeInTheDocument();
  });

  it('renders as a link when href is provided', () => {
    render(<Button href="/wardrobe">Go to Wardrobe</Button>);
    const link = screen.getByRole('link', { name: /go to wardrobe/i });
    expect(link).toHaveAttribute('href', '/wardrobe');
  });

  // --- Variants ---

  it('applies primary variant styles', () => {
    render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');
  });

  it('applies secondary variant styles', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');
  });

  it('applies danger variant styles', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('applies ghost variant styles', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  // --- Sizes ---

  it('applies small size', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8');
  });

  it('applies default (medium) size', () => {
    render(<Button size="md">Medium</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10');
  });

  it('applies large size', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-12');
  });

  // --- States ---

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument(); // text hidden
  });

  it('disables button when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows full width when fullWidth is true', () => {
    render(<Button fullWidth>Full</Button>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  // --- Click Handlers ---

  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Click Me</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick} disabled>Disabled</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not call onClick when loading', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick} isLoading>Loading</Button>);
    await user.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
  });

  // --- Accessibility ---

  it('has accessible name', () => {
    render(<Button aria-label="Close dialog">X</Button>);
    expect(screen.getByRole('button', { name: /close dialog/i })).toBeInTheDocument();
  });

  it('supports aria-pressed for toggle buttons', () => {
    render(<Button aria-pressed={true}>Toggle</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  // --- Type Attribute ---

  it('has type="button" by default', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('allows overriding type to submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  // --- Custom Class Names ---

  it('merges custom className with default classes', () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600'); // still has default
  });

  // --- Edge Cases ---

  it('renders with empty children', () => {
    render(<Button>{''}</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles double-click rapidly', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<Button onClick={onClick}>Click Me</Button>);
    await user.dblClick(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('renders as a fragment when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    expect(screen.getByRole('link')).toHaveTextContent('Link Button');
  });
});
```

## 14. Example Test: GarmentCard Component

```tsx
import { render, screen } from '@/test/utils/test-utils';
import userEvent from '@testing-library/user-event';
import { GarmentCard } from '@/components/garments/GarmentCard';

describe('GarmentCard', () => {
  const baseGarment = {
    id: 'g1',
    name: 'Blue Cotton Shirt',
    category: 'top' as const,
    color: 'blue',
    brand: 'Nike',
    size: 'M',
    imageUrl: 'https://example.com/shirt.jpg',
    favorite: false,
    timesWorn: 5,
    createdAt: '2024-01-15T10:00:00Z',
  };

  // --- Render ---

  it('renders garment name', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByText('Blue Cotton Shirt')).toBeInTheDocument();
  });

  it('renders garment image', () => {
    render(<GarmentCard garment={baseGarment} />);
    const img = screen.getByRole('img', { name: /blue cotton shirt/i });
    expect(img).toHaveAttribute('src', expect.stringContaining('shirt.jpg'));
  });

  it('renders category badge', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByText(/top/i)).toBeInTheDocument();
  });

  it('renders color indicator', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByTestId('color-indicator')).toHaveClass('bg-blue-');
  });

  it('renders brand if present', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByText('Nike')).toBeInTheDocument();
  });

  it('does not render brand when absent', () => {
    render(<GarmentCard garment={{ ...baseGarment, brand: undefined }} />);
    expect(screen.queryByTestId('garment-brand')).not.toBeInTheDocument();
  });

  it('renders size if present', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByText('M')).toBeInTheDocument();
  });

  it('renders times worn count', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByText(/5/i)).toBeInTheDocument();
  });

  // --- Favorite ---

  it('shows filled heart when favorite is true', () => {
    render(<GarmentCard garment={{ ...baseGarment, favorite: true }} />);
    expect(screen.getByTestId('favorite-icon-filled')).toBeInTheDocument();
  });

  it('shows empty heart when favorite is false', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByTestId('favorite-icon-empty')).toBeInTheDocument();
  });

  // --- Interaction ---

  it('calls onFavoriteClick when favorite button is clicked', async () => {
    const user = userEvent.setup();
    const onFavoriteClick = jest.fn();

    render(<GarmentCard garment={baseGarment} onFavoriteClick={onFavoriteClick} />);
    await user.click(screen.getByTestId('favorite-button'));

    expect(onFavoriteClick).toHaveBeenCalledWith('g1', true);
  });

  it('calls onDeleteClick when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDeleteClick = jest.fn();

    render(<GarmentCard garment={baseGarment} onDeleteClick={onDeleteClick} />);
    await user.click(screen.getByTestId('delete-button'));

    expect(onDeleteClick).toHaveBeenCalledWith('g1');
  });

  it('calls onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    render(<GarmentCard garment={baseGarment} onClick={onClick} />);
    await user.click(screen.getByTestId('garment-card'));

    expect(onClick).toHaveBeenCalledWith(baseGarment);
  });

  it('opens context menu on right-click', async () => {
    const user = userEvent.setup();
    render(<GarmentCard garment={baseGarment} />);

    await user.pointer({ keys: '[MouseRight]', target: screen.getByTestId('garment-card') });

    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('shows confirmation dialog before delete', async () => {
    const user = userEvent.setup();
    render(<GarmentCard garment={baseGarment} />);

    await user.click(screen.getByTestId('delete-button'));

    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
  });

  it('cancels delete when dialog is dismissed', async () => {
    const user = userEvent.setup();
    const onDeleteClick = jest.fn();

    render(<GarmentCard garment={baseGarment} onDeleteClick={onDeleteClick} />);
    await user.click(screen.getByTestId('delete-button'));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(onDeleteClick).not.toHaveBeenCalled();
  });

  // --- Empty State ---

  it('renders placeholder when garment is null', () => {
    render(<GarmentCard garment={null} />);
    expect(screen.getByTestId('garment-card-empty')).toBeInTheDocument();
    expect(screen.getByText(/no garment/i)).toBeInTheDocument();
  });

  it('renders placeholder when garment has no image', () => {
    render(<GarmentCard garment={{ ...baseGarment, imageUrl: '' }} />);
    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  it('renders placeholder when image fails to load', async () => {
    const user = userEvent.setup();
    render(<GarmentCard garment={baseGarment} />);

    const img = screen.getByRole('img');
    await user.event(img, 'error');

    expect(screen.getByTestId('image-placeholder')).toBeInTheDocument();
  });

  // --- Selection ---

  it('shows selected state', () => {
    render(<GarmentCard garment={baseGarment} isSelected={true} />);
    expect(screen.getByTestId('garment-card')).toHaveClass('ring-2');
  });

  it('does not show selected state by default', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByTestId('garment-card')).not.toHaveClass('ring-2');
  });

  // --- Accessibility ---

  it('has accessible image alt text', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Blue Cotton Shirt');
  });

  it('has accessible favorite button', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByTestId('favorite-button')).toHaveAttribute('aria-label', 'Add to favorites');
  });

  it('has accessible delete button', () => {
    render(<GarmentCard garment={baseGarment} />);
    expect(screen.getByTestId('delete-button')).toHaveAttribute('aria-label', 'Delete garment');
  });

  it('has accessible role for card', () => {
    render(<GarmentCard garment={baseGarment} onClick={jest.fn()} />);
    expect(screen.getByTestId('garment-card')).toHaveAttribute('role', 'button');
  });
});
```

## 15. Example Test: useAuth Hook

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { useAuth } from '@/hooks/useAuth';

const server = setupServer(
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    if (email === 'test@example.com' && password === 'correct') {
      return HttpResponse.json({
        accessToken: 'jwt-access-token',
        refreshToken: 'jwt-refresh-token',
        user: { id: 'u1', email: 'test@example.com', name: 'Test User', role: 'user' },
      });
    }
    if (email === 'inactive@example.com') {
      return HttpResponse.json({ message: 'Account is inactive' }, { status: 403 });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/auth/register', async ({ request }) => {
    const { email } = await request.json();
    if (email === 'existing@example.com') {
      return HttpResponse.json({ message: 'Email already registered' }, { status: 409 });
    }
    return HttpResponse.json({
      accessToken: 'jwt-access-token',
      refreshToken: 'jwt-refresh-token',
      user: { id: 'u2', email, name: 'New User', role: 'user' },
    });
  }),

  http.post('/api/auth/refresh', async () => {
    return HttpResponse.json({
      accessToken: 'new-jwt-access-token',
      refreshToken: 'new-jwt-refresh-token',
    });
  }),

  http.post('/api/auth/logout', () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json({
      id: 'u1',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
    });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  localStorage.clear();
});
afterAll(() => server.close());

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAuth hook', () => {
  describe('initial state', () => {
    it('starts unauthenticated with no user', () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('restores session from localStorage', () => {
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: 'u1', email: 'stored@example.com', name: 'Stored' },
          accessToken: 'old-token',
          refreshToken: 'old-refresh',
          isAuthenticated: true,
        },
        version: 0,
      }));

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('stored@example.com');
    });

    it('handles corrupted localStorage', () => {
      localStorage.setItem('auth-storage', 'invalid-json{{');
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    it('sets user and tokens on successful login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toMatchObject({
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('throws on invalid credentials', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await expect(
          result.current.login({ email: 'test@example.com', password: 'wrong' })
        ).rejects.toThrow(/invalid credentials/i);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('throws on inactive account', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await expect(
          result.current.login({ email: 'inactive@example.com', password: 'correct' })
        ).rejects.toThrow(/inactive/i);
      });
    });

    it('persists auth data after login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      const stored = JSON.parse(localStorage.getItem('auth-storage')!);
      expect(stored.state.isAuthenticated).toBe(true);
      expect(stored.state.accessToken).toBeDefined();
    });
  });

  describe('register', () => {
    it('creates user and logs in automatically', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.register({
          email: 'new@example.com',
          password: 'StrongP@ss1',
          name: 'New User',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('new@example.com');
    });

    it('throws on duplicate email', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await expect(
          result.current.register({
            email: 'existing@example.com',
            password: 'StrongP@ss1',
            name: 'Dupe',
          })
        ).rejects.toThrow(/already registered/i);
      });
    });
  });

  describe('logout', () => {
    it('clears user and tokens', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('clears localStorage on logout', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      act(() => {
        result.current.logout();
      });

      const stored = localStorage.getItem('auth-storage');
      expect(stored).toBeNull();
    });

    it('calls logout API endpoint', async () => {
      const logoutSpy = jest.fn();
      server.use(
        http.post('/api/auth/logout', () => {
          logoutSpy();
          return new HttpResponse(null, { status: 200 });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(logoutSpy).toHaveBeenCalled();
    });
  });

  describe('token refresh', () => {
    it('refreshes access token automatically', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      const oldAccessToken = result.current.accessToken;

      await act(async () => {
        await result.current.refreshToken();
      });

      const newAccessToken = result.current.accessToken;
      expect(newAccessToken).not.toBe(oldAccessToken);
    });

    it('handles refresh token expiry', async () => {
      server.use(
        http.post('/api/auth/refresh', () => {
          return HttpResponse.json({ message: 'Refresh token expired' }, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      await act(async () => {
        await expect(result.current.refreshToken()).rejects.toThrow(/expired/i);
      });

      // Should be logged out
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('fetches current user profile', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      await act(async () => {
        await result.current.getProfile();
      });

      expect(result.current.user?.name).toBe('Test User');
    });
  });

  describe('state transitions', () => {
    it('sets loading state during login', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      let loginPromise: Promise<void>;
      act(() => {
        loginPromise = result.current.login({ email: 'test@example.com', password: 'correct' });
      });

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await loginPromise;
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('handles multiple rapid logins gracefully', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

      await act(async () => {
        await Promise.all([
          result.current.login({ email: 'test@example.com', password: 'correct' }).catch(() => {}),
          result.current.login({ email: 'test@example.com', password: 'correct' }).catch(() => {}),
        ]);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});
```

## 16. Example Test: useGarmentStore

```tsx
import { act, renderHook } from '@testing-library/react';
import { useGarmentStore } from '@/stores/garment-store';

describe('useGarmentStore', () => {
  beforeEach(() => {
    act(() => {
      useGarmentStore.getState().reset();
    });
  });

  describe('state initialization', () => {
    it('initializes with empty garments', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.garments).toEqual([]);
    });

    it('initializes with null selectedGarment', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.selectedGarment).toBeNull();
    });

    it('initializes with default filter', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.filter).toEqual({ category: 'all', color: 'all', search: '' });
    });

    it('initializes with empty loading state', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.isLoading).toBe(false);
    });

    it('initializes with no error', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.error).toBeNull();
    });
  });

  describe('addGarment', () => {
    it('adds a single garment to the store', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.addGarment({
          id: 'g1',
          name: 'New Garment',
          category: 'top',
          color: 'blue',
        });
      });

      expect(result.current.garments).toHaveLength(1);
      expect(result.current.garments[0].name).toBe('New Garment');
    });

    it('adds garment to the beginning of the list', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.addGarment({ id: 'g1', name: 'First' });
        result.current.addGarment({ id: 'g2', name: 'Second' });
      });

      expect(result.current.garments[0].name).toBe('Second');
    });

    it('does not add duplicate id', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.addGarment({ id: 'g1', name: 'Original' });
      });

      act(() => {
        result.current.addGarment({ id: 'g1', name: 'Duplicate' });
      });

      expect(result.current.garments).toHaveLength(1);
      expect(result.current.garments[0].name).toBe('Original');
    });
  });

  describe('setGarments', () => {
    it('replaces all garments', () => {
      const { result } = renderHook(() => useGarmentStore());

      const garments = [
        { id: 'g1', name: 'A' },
        { id: 'g2', name: 'B' },
      ];

      act(() => {
        result.current.setGarments(garments as any);
      });

      expect(result.current.garments).toHaveLength(2);
    });

    it('handles empty array', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Temp' }] as any);
      });

      act(() => {
        result.current.setGarments([]);
      });

      expect(result.current.garments).toEqual([]);
    });

    it('handles large dataset', () => {
      const { result } = renderHook(() => useGarmentStore());
      const garments = Array.from({ length: 1000 }, (_, i) => ({
        id: `g${i}`,
        name: `Garment ${i}`,
      }));

      act(() => {
        result.current.setGarments(garments as any);
      });

      expect(result.current.garments).toHaveLength(1000);
    });
  });

  describe('updateGarment', () => {
    it('updates garment name', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Old', category: 'top', color: 'red' }] as any);
      });

      act(() => {
        result.current.updateGarment('g1', { name: 'New Name' });
      });

      expect(result.current.garments[0].name).toBe('New Name');
    });

    it('updates multiple fields', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Original', category: 'top', color: 'red' }] as any);
      });

      act(() => {
        result.current.updateGarment('g1', { name: 'Updated', color: 'blue', favorite: true });
      });

      const g = result.current.garments[0];
      expect(g.name).toBe('Updated');
      expect(g.color).toBe('blue');
      expect(g.favorite).toBe(true);
    });

    it('throws error for non-existent garment', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Only Garment' }] as any);
      });

      expect(() => {
        result.current.updateGarment('non-existent', { name: 'Ghost' });
      }).toThrow(/not found/i);
    });

    it('updates only specified fields', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Original', category: 'top', color: 'red', brand: 'Nike' }] as any);
      });

      act(() => {
        result.current.updateGarment('g1', { brand: 'Adidas' });
      });

      const g = result.current.garments[0];
      expect(g.name).toBe('Original');
      expect(g.category).toBe('top');
      expect(g.brand).toBe('Adidas');
    });
  });

  describe('removeGarment', () => {
    it('removes a garment by id', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([
          { id: 'g1', name: 'Keep' },
          { id: 'g2', name: 'Remove' },
        ] as any);
      });

      act(() => {
        result.current.removeGarment('g2');
      });

      expect(result.current.garments).toHaveLength(1);
      expect(result.current.garments[0].id).toBe('g1');
    });

    it('removes the selected garment if deleted', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Selected' }] as any);
        result.current.selectGarment({ id: 'g1', name: 'Selected' } as any);
      });

      act(() => {
        result.current.removeGarment('g1');
      });

      expect(result.current.selectedGarment).toBeNull();
    });

    it('does nothing when id does not exist', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Safe' }] as any);
      });

      act(() => {
        result.current.removeGarment('non-existent');
      });

      expect(result.current.garments).toHaveLength(1);
    });
  });

  describe('removeGarments (bulk)', () => {
    it('removes multiple garments', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([
          { id: 'g1', name: 'A' },
          { id: 'g2', name: 'B' },
          { id: 'g3', name: 'C' },
          { id: 'g4', name: 'D' },
        ] as any);
      });

      act(() => {
        result.current.removeGarments(['g1', 'g3']);
      });

      expect(result.current.garments).toHaveLength(2);
      expect(result.current.garments.map(g => g.id)).toEqual(['g2', 'g4']);
    });

    it('handles empty id array', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([{ id: 'g1', name: 'Safe' }] as any);
      });

      act(() => {
        result.current.removeGarments([]);
      });

      expect(result.current.garments).toHaveLength(1);
    });
  });

  describe('selectGarment / clearSelection', () => {
    it('selects a garment', () => {
      const { result } = renderHook(() => useGarmentStore());
      const garment = { id: 'g1', name: 'Selected Garment' };

      act(() => {
        result.current.selectGarment(garment as any);
      });

      expect(result.current.selectedGarment).toEqual(garment);
    });

    it('clears selection', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.selectGarment({ id: 'g1', name: 'Temp' } as any);
      });

      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedGarment).toBeNull();
    });

    it('replaces existing selection', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.selectGarment({ id: 'g1', name: 'First' } as any);
      });

      act(() => {
        result.current.selectGarment({ id: 'g2', name: 'Second' } as any);
      });

      expect(result.current.selectedGarment?.id).toBe('g2');
    });
  });

  describe('setFilter', () => {
    it('sets category filter', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ category: 'bottom' });
      });

      expect(result.current.filter.category).toBe('bottom');
    });

    it('sets color filter', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ color: 'red' });
      });

      expect(result.current.filter.color).toBe('red');
    });

    it('sets search term', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ search: 'shirt' });
      });

      expect(result.current.filter.search).toBe('shirt');
    });

    it('merges with existing filter', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ category: 'top' });
      });

      act(() => {
        result.current.setFilter({ color: 'blue' });
      });

      expect(result.current.filter).toEqual({ category: 'top', color: 'blue', search: '' });
    });

    it('resets filter when setFilter is called with empty values', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ category: 'top', color: 'blue', search: 'test' });
      });

      act(() => {
        result.current.setFilter({});
      });

      expect(result.current.filter).toEqual({ category: 'top', color: 'blue', search: 'test' });
    });
  });

  describe('getFilteredGarments', () => {
    beforeEach(() => {
      act(() => {
        useGarmentStore.getState().setGarments([
          { id: 'g1', name: 'Red Shirt', category: 'top', color: 'red', favorite: false },
          { id: 'g2', name: 'Blue Shirt', category: 'top', color: 'blue', favorite: true },
          { id: 'g3', name: 'Black Pants', category: 'bottom', color: 'black', favorite: false },
          { id: 'g4', name: 'White Shoes', category: 'footwear', color: 'white', favorite: true },
          { id: 'g5', name: 'Red Shoes', category: 'footwear', color: 'red', favorite: false },
        ] as any);
      });
    });

    it('returns all garments with no filters', () => {
      const { result } = renderHook(() => useGarmentStore());
      expect(result.current.getFilteredGarments()).toHaveLength(5);
    });

    it('filters by category', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ category: 'top' });
      });

      expect(result.current.getFilteredGarments()).toHaveLength(2);
      expect(result.current.getFilteredGarments().every(g => g.category === 'top')).toBe(true);
    });

    it('filters by color', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ color: 'red' });
      });

      expect(result.current.getFilteredGarments()).toHaveLength(2);
      expect(result.current.getFilteredGarments().every(g => g.color === 'red')).toBe(true);
    });

    it('filters by category and color combined', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ category: 'footwear', color: 'red' });
      });

      const filtered = result.current.getFilteredGarments();
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Red Shoes');
    });

    it('searches by name (case-insensitive)', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ search: 'shirt' });
      });

      expect(result.current.getFilteredGarments()).toHaveLength(2);
    });

    it('returns empty array when no match', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setFilter({ search: 'nonexistent' });
      });

      expect(result.current.getFilteredGarments()).toEqual([]);
    });
  });

  describe('getCategoryCounts', () => {
    it('counts garments per category', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([
          { id: 'g1', category: 'top' },
          { id: 'g2', category: 'top' },
          { id: 'g3', category: 'bottom' },
        ] as any);
      });

      expect(result.current.getCategoryCounts()).toEqual({
        top: 2, bottom: 1, footwear: 0, accessory: 0, outerwear: 0,
      });
    });
  });

  describe('getFavoriteGarments', () => {
    it('returns only favorite garments', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setGarments([
          { id: 'g1', favorite: true },
          { id: 'g2', favorite: false },
          { id: 'g3', favorite: true },
        ] as any);
      });

      const favorites = result.current.getFavoriteGarments();
      expect(favorites).toHaveLength(2);
      expect(favorites.every(g => g.favorite)).toBe(true);
    });
  });

  describe('reset', () => {
    it('resets to initial state', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.addGarment({ id: 'g1', name: 'Temp' } as any);
        result.current.selectGarment({ id: 'g1', name: 'Temp' } as any);
        result.current.setFilter({ category: 'top' });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.garments).toEqual([]);
      expect(result.current.selectedGarment).toBeNull();
      expect(result.current.filter).toEqual({ category: 'all', color: 'all', search: '' });
    });
  });

  describe('error handling', () => {
    it('sets error state', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setError('Something went wrong');
      });

      expect(result.current.error).toBe('Something went wrong');
    });

    it('clears error state', () => {
      const { result } = renderHook(() => useGarmentStore());

      act(() => {
        result.current.setError('Failed');
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});
```
