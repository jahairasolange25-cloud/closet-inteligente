'use client';

import { createContext, useContext, useRef } from 'react';
import type { WebGLRenderer } from 'three';

interface RendererContextValue {
  rendererRef: React.MutableRefObject<WebGLRenderer | null>;
}

const RendererContext = createContext<RendererContextValue | null>(null);

export function RendererProvider({ children }: { children: React.ReactNode }) {
  const rendererRef = useRef<WebGLRenderer | null>(null);
  return (
    <RendererContext.Provider value={{ rendererRef }}>
      {children}
    </RendererContext.Provider>
  );
}

export function useRenderer() {
  const ctx = useContext(RendererContext);
  if (!ctx) throw new Error('useRenderer must be inside RendererProvider');
  return ctx;
}
