'use client';

import { useEffect } from 'react';
import { metrics } from '../lib/metrics';

interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

function getRating(name: string, value: number): WebVitalMetric['rating'] {
  switch (name) {
    case 'LCP':
      return value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor';
    case 'FID':
      return value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor';
    case 'CLS':
      return value <= 0.1 ? 'good' : value <= 0.25 ? 'needs-improvement' : 'poor';
    case 'INP':
      return value <= 200 ? 'good' : value <= 500 ? 'needs-improvement' : 'poor';
    case 'TTFB':
      return value <= 800 ? 'good' : value <= 1800 ? 'needs-improvement' : 'poor';
    default:
      return 'needs-improvement';
  }
}

export function useWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      import('web-vitals').then(({ onLCP, onCLS, onINP, onTTFB }) => {
        const handler = (metric: { name: string; value: number }) => {
          metrics.record(
            `web_vital_${metric.name.toLowerCase()}`,
            metric.value,
            'ms',
            { rating: getRating(metric.name, metric.value) },
          );
        };

        onLCP(handler);
        onCLS(handler);
        onINP(handler);
        onTTFB(handler);
      });
    } catch {
      // web-vitals package may not be installed
    }
  }, []);
}
