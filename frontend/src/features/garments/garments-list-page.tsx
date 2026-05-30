'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Shirt, X } from 'lucide-react';
import Link from 'next/link';
import { useGarments } from '@/hooks/use-garments';
import { GarmentCard } from './garment-card';
import { GarmentFiltersPanel } from './garment-filters-panel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GarmentCardSkeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import type { GarmentFilters } from '@/types/garment';

const DEFAULT_FILTERS: GarmentFilters = { page: 1, limit: 24, sortBy: 'created_at', sortOrder: 'desc' };

function countActiveFilters(filters: GarmentFilters): number {
  let count = 0;
  if (filters.category) count++;
  if (filters.state) count++;
  if (filters.isFavorite !== undefined) count++;
  if (filters.search) count++;
  if (filters.sortBy && filters.sortBy !== 'created_at') count++;
  return count;
}

export function GarmentsListPage() {
  const [filters, setFilters] = useState<GarmentFilters>(DEFAULT_FILTERS);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { data, isLoading, error } = useGarments(filters);

  const activeCount = countActiveFilters(filters);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: search || undefined, page: 1 }));
  };

  const handleClearSearch = () => {
    setSearch('');
    setFilters((f) => ({ ...f, search: undefined, page: 1 }));
  };

  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setSearch('');
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Mi Closet</h1>
          {data && (
            <p className="text-sm text-neutral-500 mt-0.5">
              {data.meta.total} prenda{data.meta.total !== 1 ? 's' : ''}
              {activeCount > 0 ? ` (filtradas)` : ''}
            </p>
          )}
        </div>
        <Link href="/garments/new">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Añadir prenda</Button>
        </Link>
      </div>

      {/* Search + Filter toggle */}
      <div className="flex gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Buscar prendas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              rightIcon={
                search ? (
                  <button type="button" onClick={handleClearSearch} aria-label="Limpiar búsqueda">
                    <X className="h-4 w-4" />
                  </button>
                ) : undefined
              }
              aria-label="Buscar prendas"
            />
          </div>
          <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </Button>
        </form>
        <Button
          type="button"
          variant={showFilters ? 'secondary' : 'outline'}
          leftIcon={<Filter className="h-4 w-4" />}
          onClick={() => setShowFilters((v) => !v)}
          aria-expanded={showFilters}
          aria-controls="filters-panel"
          className="relative"
        >
          Filtros
          {activeCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-primary-500 text-[10px] text-white flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </Button>
      </div>

      <div className="flex gap-6 items-start">
        {/* Filter sidebar */}
        {showFilters && (
          <aside id="filters-panel" className="w-64 flex-shrink-0 hidden md:block">
            <GarmentFiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              activeCount={activeCount}
            />
          </aside>
        )}

        {/* Mobile filter panel */}
        {showFilters && (
          <div className="w-full md:hidden">
            <GarmentFiltersPanel
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              activeCount={activeCount}
            />
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <ErrorBoundary>
            {error ? (
              <div role="alert" className="text-sm text-error-600 p-4 bg-error-50 rounded-lg dark:bg-error-900/20 dark:text-error-400">
                Error al cargar prendas. Por favor recarga la página.
              </div>
            ) : isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: 12 }).map((_, i) => <GarmentCardSkeleton key={i} />)}
              </div>
            ) : !data?.data.length ? (
              <EmptyState
                icon={<Shirt className="h-8 w-8" />}
                title={activeCount > 0 ? 'Sin resultados' : 'Tu closet está vacío'}
                description={
                  activeCount > 0
                    ? 'Prueba con otros filtros o términos de búsqueda'
                    : 'Añade tu primera prenda para empezar'
                }
                action={
                  activeCount > 0 ? (
                    <Button variant="outline" onClick={handleResetFilters} leftIcon={<X className="h-4 w-4" />}>
                      Limpiar filtros
                    </Button>
                  ) : (
                    <Link href="/garments/new">
                      <Button leftIcon={<Plus className="h-4 w-4" />}>Añadir prenda</Button>
                    </Link>
                  )
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {data.data.map((garment) => (
                  <GarmentCard key={garment.id} garment={garment} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data && data.meta.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.meta.page || data.meta.page <= 1}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
                >
                  Anterior
                </Button>
                <span className="text-sm text-neutral-500">
                  Página {data.meta.page} de {data.meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={data.meta.page === data.meta.totalPages}
                  onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
                >
                  Siguiente
                </Button>
              </div>
            )}
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
