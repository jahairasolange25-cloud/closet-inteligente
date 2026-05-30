'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import type { GarmentFilters, GarmentCategory, GarmentState } from '@/types/garment';

const CATEGORIES: { value: GarmentCategory; label: string }[] = [
  { value: 'shirts', label: 'Camisas' },
  { value: 'blouses', label: 'Blusas' },
  { value: 'tshirts', label: 'Camisetas' },
  { value: 'sweaters', label: 'Suéteres' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'jackets', label: 'Chaquetas' },
  { value: 'coats', label: 'Abrigos' },
  { value: 'pants', label: 'Pantalones' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'skirts', label: 'Faldas' },
  { value: 'dresses', label: 'Vestidos' },
  { value: 'jumpsuits', label: 'Monos' },
  { value: 'sneakers', label: 'Zapatillas' },
  { value: 'boots', label: 'Botas' },
  { value: 'heels', label: 'Tacones' },
  { value: 'sandals', label: 'Sandalias' },
  { value: 'bags', label: 'Bolsos' },
  { value: 'hats', label: 'Sombreros' },
  { value: 'scarves', label: 'Bufandas' },
  { value: 'belts', label: 'Cinturones' },
  { value: 'jewelry', label: 'Joyería' },
  { value: 'other', label: 'Otros' },
];

const STATES: { value: GarmentState; label: string; color: string }[] = [
  { value: 'available', label: 'Disponible', color: 'bg-success-100 text-success-700 border-success-200' },
  { value: 'washing', label: 'En lavado', color: 'bg-warning-100 text-warning-700 border-warning-200' },
  { value: 'damaged', label: 'Dañada', color: 'bg-error-100 text-error-700 border-error-200' },
  { value: 'storage', label: 'Guardada', color: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
  { value: 'for_sale', label: 'En venta', color: 'bg-info-100 text-info-700 border-info-200' },
  { value: 'donated', label: 'Donada', color: 'bg-secondary-100 text-secondary-700 border-secondary-200' },
];

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Más recientes' },
  { value: 'created_at:asc', label: 'Más antiguas' },
  { value: 'name:asc', label: 'A-Z' },
  { value: 'name:desc', label: 'Z-A' },
];

interface Props {
  filters: GarmentFilters;
  onChange: (filters: GarmentFilters) => void;
  onReset: () => void;
  activeCount: number;
}

export function GarmentFiltersPanel({ filters, onChange, onReset, activeCount }: Props) {
  const currentSort = filters.sortBy ? `${filters.sortBy}:${filters.sortOrder ?? 'desc'}` : 'created_at:desc';

  const setCategory = (cat: GarmentCategory | undefined) =>
    onChange({ ...filters, category: cat, page: 1 });

  const setState = (state: GarmentState | undefined) =>
    onChange({ ...filters, state, page: 1 });

  const setFavorite = (val: boolean | undefined) =>
    onChange({ ...filters, isFavorite: val, page: 1 });

  const setSort = (val: string) => {
    const [sortBy, sortOrder] = val.split(':') as [string, 'asc' | 'desc'];
    onChange({ ...filters, sortBy, sortOrder, page: 1 });
  };

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Filtros</span>
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} leftIcon={<X className="h-3 w-3" />}>
            Limpiar ({activeCount})
          </Button>
        )}
      </div>

      {/* Sort */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Ordenar</p>
        <select
          value={currentSort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 text-sm text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Favorites */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Tipo</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFavorite(undefined)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filters.isFavorite === undefined
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setFavorite(true)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              filters.isFavorite === true
                ? 'bg-primary-500 text-white border-primary-500'
                : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
            )}
          >
            ❤ Favoritas
          </button>
        </div>
      </div>

      {/* State */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Estado</p>
        <div className="flex flex-wrap gap-2">
          {STATES.map((s) => (
            <button
              key={s.value}
              onClick={() => setState(filters.state === s.value ? undefined : s.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                filters.state === s.value
                  ? s.color + ' ring-2 ring-offset-1 ring-neutral-400'
                  : s.color + ' opacity-60 hover:opacity-100',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Categoría</p>
        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(filters.category === cat.value ? undefined : cat.value)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                filters.category === cat.value
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800',
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active filter chips summary */}
      {activeCount > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-neutral-100 dark:border-neutral-800">
          {filters.category && (
            <Badge variant="primary" className="gap-1">
              {CATEGORIES.find((c) => c.value === filters.category)?.label}
              <button onClick={() => setCategory(undefined)} aria-label="Quitar filtro de categoría">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.state && (
            <Badge variant="warning" className="gap-1">
              {STATES.find((s) => s.value === filters.state)?.label}
              <button onClick={() => setState(undefined)} aria-label="Quitar filtro de estado">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.isFavorite === true && (
            <Badge variant="error" className="gap-1">
              Favoritas
              <button onClick={() => setFavorite(undefined)} aria-label="Quitar filtro de favoritas">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
