export interface BrowserCompatReport {
  unsupportedApis: string[];
  warnings: string[];
  isSupported: boolean;
}

export function checkBrowserCompatibility(): BrowserCompatReport {
  if (typeof window === 'undefined') {
    return { unsupportedApis: [], warnings: [], isSupported: true };
  }

  const unsupportedApis: string[] = [];
  const warnings: string[] = [];

  const checks = [
    { name: 'WebSocket', condition: typeof WebSocket !== 'undefined' },
    { name: 'localStorage', condition: typeof Storage !== 'undefined' },
    { name: 'BroadcastChannel', condition: typeof BroadcastChannel !== 'undefined' },
    { name: 'IntersectionObserver', condition: typeof IntersectionObserver !== 'undefined' },
    { name: 'ResizeObserver', condition: typeof ResizeObserver !== 'undefined' },
    { name: 'fetch', condition: typeof fetch !== 'undefined' },
    { name: 'Promise', condition: typeof Promise !== 'undefined' },
    { name: 'AbortController', condition: typeof AbortController !== 'undefined' },
    { name: 'CustomEvent', condition: typeof CustomEvent !== 'undefined' },
    { name: 'WebGL (3D rendering)', condition: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
      } catch { return false; }
    })() },
  ];

  for (const check of checks) {
    if (!check.condition) {
      unsupportedApis.push(check.name);
    }
  }

  if (navigator.userAgent.includes('Chrome') && parseInt(navigator.userAgent.match(/Chrome\/(\d+)/)?.[1] || '0') < 90) {
    warnings.push('Chrome version < 90 detected. Some features may not work.');
  }

  return {
    unsupportedApis,
    warnings,
    isSupported: unsupportedApis.length === 0,
  };
}
