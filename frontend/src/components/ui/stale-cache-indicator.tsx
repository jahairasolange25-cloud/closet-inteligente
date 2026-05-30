'use client';

interface StaleCacheIndicatorProps {
  lastUpdated: Date | null;
  isStale: boolean;
  onRefresh: () => void;
}

export function StaleCacheIndicator({ lastUpdated, isStale, onRefresh }: StaleCacheIndicatorProps) {
  if (!isStale && lastUpdated) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-3 px-3 py-2 mb-4 text-sm rounded-lg bg-amber-50 border border-amber-200 text-amber-800"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="flex-1">
        {lastUpdated
          ? `Datos actualizados: ${lastUpdated.toLocaleTimeString()}`
          : 'Esperando datos actualizados...'}
      </span>
      <button
        onClick={onRefresh}
        className="px-3 py-1 text-xs font-medium rounded bg-amber-200 hover:bg-amber-300 transition-colors"
      >
        Actualizar
      </button>
    </div>
  );
}
