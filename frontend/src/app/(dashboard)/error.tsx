'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DashboardError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[DashboardError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center min-h-[60vh]" role="alert">
      <AlertTriangle className="h-12 w-12 text-error-400" aria-hidden />
      <div>
        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100">
          Algo salió mal
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {error.message ?? 'Error inesperado en esta sección'}
        </p>
      </div>
      <Button variant="outline" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
