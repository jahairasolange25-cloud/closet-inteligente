'use client';

import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useOutfits, useOutfitRecommendations } from '@/hooks/use-outfits';
import { OutfitCard } from './outfit-card';
import { Button } from '@/components/ui/button';
import { GarmentCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Badge } from '@/components/ui/badge';
import type { OutfitFilters } from '@/types/outfit';

export function OutfitsListPage() {
  const [filters] = useState<OutfitFilters>({ page: 1, limit: 20 });
  const { data, isLoading, error } = useOutfits(filters);
  const recommendMutation = useOutfitRecommendations();

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Mis Outfits</h1>
          {data && <p className="text-sm text-neutral-500 mt-0.5">{data.meta.total} outfits</p>}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Sparkles className="h-4 w-4" />}
            loading={recommendMutation.isPending}
            onClick={() => recommendMutation.mutate({ count: 3 })}
          >
            Recomendar
          </Button>
          <Link href="/outfits/new">
            <Button leftIcon={<Plus className="h-4 w-4" />}>Crear outfit</Button>
          </Link>
        </div>
      </div>

      {/* Recommendations banner (stub notice) */}
      {recommendMutation.data && (
        <div className="rounded-xl border border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-warning-600" />
            <span className="text-sm font-medium text-warning-700 dark:text-warning-400">Recomendaciones</span>
            <Badge variant="warning">Heurístico</Badge>
          </div>
          {recommendMutation.data.meta.warning && (
            <p className="text-xs text-warning-600 dark:text-warning-400 mb-3">{recommendMutation.data.meta.warning}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommendMutation.data.recommendations.map((r) => (
              <div key={r.outfit.id} className="rounded-lg bg-white dark:bg-neutral-900 p-3 border border-warning-100 dark:border-warning-900">
                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{r.outfit.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{r.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <ErrorBoundary>
        {error ? (
          <div role="alert" className="text-sm text-error-600 p-4 bg-error-50 rounded-lg">
            Error al cargar outfits.
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <GarmentCardSkeleton key={i} />)}
          </div>
        ) : !data?.data.length ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="Sin outfits todavía"
            description="Crea tu primer outfit combinando prendas de tu closet"
            action={<Link href="/outfits/new"><Button leftIcon={<Plus className="h-4 w-4" />}>Crear outfit</Button></Link>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.data.map((outfit) => (
              <OutfitCard key={outfit.id} outfit={outfit} />
            ))}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}
