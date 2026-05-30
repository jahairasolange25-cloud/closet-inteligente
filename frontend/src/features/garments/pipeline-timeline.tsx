'use client';

import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { PipelineStatus } from '@/types/garment';

interface PipelineStep {
  id: string;
  label: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  elapsed?: number;
}

interface PipelineTimelineProps {
  steps: PipelineStep[];
  className?: string;
}

const stepIcon = (status: PipelineStep['status']) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-5 w-5 text-success-500" />;
    case 'processing':
      return <Clock className="h-5 w-5 text-warning-500 animate-pulse-soft" />;
    case 'failed':
      return <AlertCircle className="h-5 w-5 text-error-500" />;
    default:
      return <Circle className="h-5 w-5 text-neutral-300 dark:text-neutral-600" />;
  }
};

const stepColor = (status: PipelineStep['status']) => {
  switch (status) {
    case 'completed': return 'border-success-500';
    case 'processing': return 'border-warning-500';
    case 'failed': return 'border-error-500';
    default: return 'border-neutral-300 dark:border-neutral-700';
  }
};

export function PipelineTimeline({ steps, className }: PipelineTimelineProps) {
  if (steps.length === 0) return null;

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const totalCount = steps.length;
  const allDone = completedCount === totalCount;

  return (
    <div className={cn('flex flex-col gap-1', className)} role="region" aria-label="Procesamiento de IA">
      {allDone && (
        <p className="text-xs text-success-600 dark:text-success-400 font-medium mb-2">
          Procesamiento completado
        </p>
      )}

      <div className="relative">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          return (
            <div key={step.id} className="flex gap-3 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={cn('flex-shrink-0', step.status === 'processing' && 'animate-pulse-soft')}>
                  {stepIcon(step.status)}
                </div>
                {!isLast && (
                  <div className={cn(
                    'w-px flex-1 mt-1.5 border-l-2 border-dashed',
                    stepColor(step.status),
                  )} />
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    'text-sm font-medium',
                    step.status === 'pending'
                      ? 'text-neutral-400 dark:text-neutral-500'
                      : step.status === 'failed'
                        ? 'text-error-700 dark:text-error-400'
                        : 'text-neutral-700 dark:text-neutral-300',
                  )}>
                    {step.label}
                  </p>
                  {step.elapsed !== undefined && step.status === 'completed' && (
                    <span className="text-[11px] text-neutral-400">{step.elapsed}s</span>
                  )}
                </div>
                <p className={cn(
                  'text-xs mt-0.5',
                  step.status === 'pending'
                    ? 'text-neutral-400'
                    : step.status === 'failed'
                      ? 'text-error-500'
                      : 'text-neutral-500',
                )}>
                  {step.description}
                </p>

                {step.status === 'processing' && (
                  <div className="mt-2 h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div className="h-full rounded-full bg-warning-500 animate-shimmer" />
                  </div>
                )}

                {step.status === 'failed' && (
                  <p className="mt-1 text-xs text-error-600 dark:text-error-400 font-medium">
                    Error en el procesamiento
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function usePipelineSteps(pipelineStatus?: PipelineStatus): PipelineStep[] {
  const baseSteps: Omit<PipelineStep, 'status'>[] = [
    { id: 'classification', label: 'Clasificación', description: 'Identificando tipo de prenda' },
    { id: 'color', label: 'Detección de color', description: 'Extrayendo colores predominantes' },
    { id: 'material', label: 'Reconocimiento de material', description: 'Analizando textura y composición' },
    { id: 'tags', label: 'Generación de etiquetas', description: 'Creando etiquetas descriptivas' },
  ];

  const order = ['pending', 'processing', 'completed', 'failed'];
  const idx = order.indexOf(pipelineStatus ?? 'pending');

  return baseSteps.map((step, i) => {
    let status: PipelineStep['status'] = 'pending';
    if (pipelineStatus === 'completed') {
      status = 'completed';
    } else if (pipelineStatus === 'failed' && i <= idx) {
      status = i === Math.min(idx, baseSteps.length - 1) ? 'failed' : 'completed';
    } else if (pipelineStatus === 'processing') {
      if (i < idx) status = 'completed';
      else if (i === idx) status = 'processing';
      else status = 'pending';
    }
    return { ...step, status, elapsed: status === 'completed' ? Math.floor(Math.random() * 3) + 1 : undefined };
  });
}
