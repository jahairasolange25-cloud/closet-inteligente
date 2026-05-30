'use client';

import { useEffect, useCallback } from 'react';

interface ClientError {
  message: string;
  source: string;
  lineno: number | null;
  colno: number | null;
  stack?: string;
  timestamp: number;
  url: string;
}

const errorBuffer: ClientError[] = [];
const MAX_ERRORS = 100;

function aggregateError(event: ClientError) {
  errorBuffer.push(event);
  if (errorBuffer.length > MAX_ERRORS) errorBuffer.shift();
}

function flushErrors() {
  if (errorBuffer.length === 0) return;
  const payload = [...errorBuffer];
  errorBuffer.length = 0;

  if (navigator.sendBeacon) {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    navigator.sendBeacon('/api/v1/analytics/client-errors', blob);
  }
}

setInterval(flushErrors, 60000);

export function useErrorTracking() {
  const handleError = useCallback((event: ErrorEvent | PromiseRejectionEvent) => {
    let clientError: ClientError;

    if (event instanceof PromiseRejectionEvent) {
      clientError = {
        message: event.reason?.message || String(event.reason),
        source: 'unhandledrejection',
        lineno: null,
        colno: null,
        stack: event.reason?.stack,
        timestamp: Date.now(),
        url: window.location.href,
      };
    } else {
      clientError = {
        message: event.message,
        source: event.filename || 'unknown',
        lineno: event.lineno,
        colno: event.colno,
        timestamp: Date.now(),
        url: window.location.href,
      };
    }

    aggregateError(clientError);
  }, []);

  useEffect(() => {
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, [handleError]);
}
