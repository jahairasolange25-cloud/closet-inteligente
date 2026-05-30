'use client';

import { X, Upload, CheckCircle, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

export interface UploadItem {
  id: string;
  fileName: string;
  status: 'queued' | 'uploading' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

interface UploadQueueProps {
  items: UploadItem[];
  onRetry: (id: string) => void;
  onDismiss: (id: string) => void;
}

const statusConfig: Record<UploadItem['status'], { icon: React.ReactNode; label: string; color: string }> = {
  queued: { icon: <Upload className="h-4 w-4" />, label: 'En cola', color: 'text-neutral-500' },
  uploading: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Subiendo...', color: 'text-primary-500' },
  processing: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Procesando IA...', color: 'text-warning-500' },
  completed: { icon: <CheckCircle className="h-4 w-4" />, label: 'Completado', color: 'text-success-500' },
  failed: { icon: <AlertCircle className="h-4 w-4" />, label: 'Error', color: 'text-error-500' },
};

export function UploadQueue({ items, onRetry, onDismiss }: UploadQueueProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Estado de subidas">
      <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Subidas</p>
      {items.map((item) => {
        const cfg = statusConfig[item.status];
        return (
          <div
            key={item.id}
            className={cn(
              'flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-all',
              item.status === 'failed'
                ? 'border-error-200 bg-error-50 dark:border-error-800 dark:bg-error-900/10'
                : 'border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900',
            )}
          >
            <span className={cn('flex-shrink-0', cfg.color)}>{cfg.icon}</span>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-neutral-700 dark:text-neutral-300">{item.fileName}</p>
                <span className={cn('text-xs whitespace-nowrap flex-shrink-0', cfg.color)}>{cfg.label}</span>
              </div>

              {item.status === 'uploading' && item.progress !== undefined && (
                <div className="mt-1.5 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'failed' && item.error && (
                <p className="mt-1 text-xs text-error-600 dark:text-error-400">{item.error}</p>
              )}
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {item.status === 'failed' && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onRetry(item.id)}
                  aria-label="Reintentar subida"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              )}
              {(item.status === 'completed' || item.status === 'failed') && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onDismiss(item.id)}
                  aria-label="Descartar"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
