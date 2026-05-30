'use client';

import { useState } from 'react';

interface AiProcessingRetryProps {
  garmentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  onRetry: (garmentId: string) => Promise<void>;
}

export function AiProcessingRetry({ garmentId, status, error, onRetry }: AiProcessingRetryProps) {
  const [retrying, setRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  if (status === 'completed') return null;

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry(garmentId);
      setRetryCount((c) => c + 1);
    } catch {
      // Error handled upstream
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-lg border ${
        status === 'failed'
          ? 'border-red-200 bg-red-50'
          : 'border-blue-200 bg-blue-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {status === 'processing' ? (
          <svg className="w-5 h-5 text-blue-600 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}

        <div className="flex-1">
          <p className="text-sm font-medium">
            {status === 'processing'
              ? 'Procesando con IA...'
              : 'Error en el procesamiento de IA'}
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
          {status === 'failed' && (
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {retrying ? 'Reintentando...' : 'Reintentar procesamiento'}
              </button>
              {retryCount > 0 && (
                <span className="text-xs text-gray-500">
                  Intentos: {retryCount}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
