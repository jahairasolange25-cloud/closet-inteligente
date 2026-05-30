'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Shirt, Sparkles, CalendarDays, TrendingUp } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/cn';

const PERIODS = [
  { label: '7 días', value: '7d' },
  { label: '30 días', value: '30d' },
  { label: '90 días', value: '90d' },
  { label: '1 año', value: '1y' },
] as const;

type Period = (typeof PERIODS)[number]['value'];

function StatCard({
  icon,
  label,
  value,
  sub,
  loading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  loading: boolean;
}) {
  return (
    <Card padding="md" className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-neutral-500 uppercase tracking-wide">{label}</p>
        {loading ? (
          <Skeleton variant="line" className="h-7 w-16 mt-1" />
        ) : (
          <p className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100 mt-0.5">{value}</p>
        )}
        {sub && !loading && <p className="text-xs text-neutral-400 mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

function BarRow({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-neutral-600 dark:text-neutral-400 w-24 truncate capitalize flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary-400 dark:bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-neutral-500 w-8 text-right flex-shrink-0">{value}</span>
    </div>
  );
}

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('30d');

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', 'dashboard', period],
    queryFn: () => analyticsService.getDashboard(period),
    staleTime: 5 * 60 * 1000,
  });

  const categoryEntries = Object.entries(data?.garmentStats.byCategory ?? {}).sort(([, a], [, b]) => b - a).slice(0, 8);
  const maxCategory = categoryEntries[0]?.[1] ?? 1;
  const colorEntries = Object.entries(data?.garmentStats.byColor ?? {}).sort(([, a], [, b]) => b - a).slice(0, 6);
  const maxColor = colorEntries[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Estadísticas</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Análisis de tu guardarropa</p>
        </div>
        <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors',
                period === p.value
                  ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 shadow-sm'
                  : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <Card padding="md">
          <p className="text-sm text-neutral-500 text-center py-8">Error cargando estadísticas. Inténtalo de nuevo.</p>
        </Card>
      ) : (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Shirt className="h-5 w-5 text-primary-500" />}
              label="Prendas"
              value={data?.garmentStats.totalGarments ?? 0}
              loading={isLoading}
            />
            <StatCard
              icon={<Sparkles className="h-5 w-5 text-secondary-500" />}
              label="Outfits"
              value={data?.outfitStats.totalOutfits ?? 0}
              loading={isLoading}
            />
            <StatCard
              icon={<CalendarDays className="h-5 w-5 text-accent-500" />}
              label="Días planificados"
              value={data?.calendarStats.plannedDays ?? 0}
              loading={isLoading}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-success-500" />}
              label="Racha actual"
              value={`${data?.calendarStats.streak ?? 0}d`}
              loading={isLoading}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Category distribution */}
            <Card padding="md" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Por categoría</h2>
                <BarChart3 className="h-4 w-4 text-neutral-400" />
              </div>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="line" className="h-4" />)}
                </div>
              ) : categoryEntries.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">Sin datos</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {categoryEntries.map(([cat, count]) => (
                    <BarRow key={cat} label={cat.replace(/_/g, ' ')} value={count} max={maxCategory} />
                  ))}
                </div>
              )}
            </Card>

            {/* Color distribution */}
            <Card padding="md" className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Por color</h2>
                <BarChart3 className="h-4 w-4 text-neutral-400" />
              </div>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} variant="line" className="h-4" />)}
                </div>
              ) : colorEntries.length === 0 ? (
                <p className="text-xs text-neutral-400 text-center py-4">Sin datos</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {colorEntries.map(([color, count]) => (
                    <BarRow key={color} label={color} value={count} max={maxColor} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Most worn */}
          {(isLoading || (data?.garmentStats.mostWorn.length ?? 0) > 0) && (
            <Card padding="md" className="flex flex-col gap-4">
              <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Prendas más usadas</h2>
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton variant="circle" className="h-8 w-8" />
                      <Skeleton variant="line" className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {data?.garmentStats.mostWorn.map((item, i) => (
                    <div key={item.garmentId} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-neutral-400 w-5 text-center">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{item.name}</p>
                      </div>
                      <Badge variant="default" className="text-xs">{item.usageCount}x</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* AI accuracy note */}
          {data?.aiPrecision && (
            <Card padding="md" className="flex items-start gap-3 bg-info-50/50 dark:bg-info-900/10 border-info-200 dark:border-info-800">
              <BarChart3 className="h-4 w-4 text-info-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-info-700 dark:text-info-300">
                  Precisión IA: {Math.round(data.aiPrecision.accuracy * 100)}%
                </p>
                <p className="text-xs text-info-600 dark:text-info-400 mt-0.5">{data.aiPrecision.note}</p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
