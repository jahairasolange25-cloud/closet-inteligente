'use client';

import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useUIStore } from '@/stores/ui-store';

const iconMap = {
  success: <CheckCircle className="h-5 w-5 text-success-500" aria-hidden />,
  error: <AlertCircle className="h-5 w-5 text-error-500" aria-hidden />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" aria-hidden />,
  info: <Info className="h-5 w-5 text-info-500" aria-hidden />,
};

const colorMap = {
  success: 'border-success-200 dark:border-success-800',
  error: 'border-error-200 dark:border-error-800',
  warning: 'border-warning-200 dark:border-warning-800',
  info: 'border-info-200 dark:border-info-800',
};

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 w-80 sm:bottom-6 sm:right-6"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

interface ToastItemProps {
  toast: { id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; duration?: number };
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timeout = setTimeout(() => onDismiss(toast.id), toast.duration ?? 4000);
    return () => clearTimeout(timeout);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 rounded-xl border bg-white p-4 shadow-lg dark:bg-neutral-900 animate-slide-up',
        colorMap[toast.type],
      )}
    >
      {iconMap[toast.type]}
      <p className="flex-1 text-sm text-neutral-700 dark:text-neutral-200">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Cerrar notificación"
        className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
