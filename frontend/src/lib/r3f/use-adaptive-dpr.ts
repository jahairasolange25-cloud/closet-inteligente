'use client';

import { useMemo } from 'react';

/**
 * Returns a DPR range that caps at 1.5 on low-end devices to avoid GPU overload.
 * R3F `dpr` accepts [min, max] — it adapts within the range based on GPU load.
 */
export function useAdaptiveDpr(): [number, number] {
  return useMemo(() => {
    if (typeof window === 'undefined') return [1, 1.5];
    const nativeDpr = window.devicePixelRatio ?? 1;
    // Cap at 1.5 on high-DPR devices; allow up to native on low-DPR
    const max = Math.min(nativeDpr, 1.5);
    return [1, max];
  }, []);
}
