'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AuthError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[AuthError]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center min-h-screen" role="alert">
      <AlertTriangle className="h-10 w-10 text-error-400" aria-hidden />
      <div>
        <h2 className="text-base font-semibold text-neutral-800 dark:text-neutral-100">
          Error de autenticación
        </h2>
        <p className="mt-1 text-sm text-neutral-500">
          {error.message ?? 'Error inesperado'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
