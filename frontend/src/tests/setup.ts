import '@testing-library/jest-dom';
import type { ReactNode } from 'react';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// Mock next/image
vi.mock('next/image', async () => {
  const { createElement } = await import('react');
  return {
    default: (props: Record<string, unknown>) => createElement('img', props),
  };
});

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn(), resolvedTheme: 'light' }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));

// Mock @react-three/fiber and @react-three/drei so canvas tests don't fail in jsdom
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: ReactNode }) => children,
  useFrame: vi.fn(),
  useThree: () => ({}),
}));

vi.mock('@react-three/drei', () => ({
  OrbitControls: () => null,
  Environment: () => null,
  Center: ({ children }: { children: ReactNode }) => children,
}));

// Suppress ResizeObserver not found in jsdom
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress matchMedia not found in jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
