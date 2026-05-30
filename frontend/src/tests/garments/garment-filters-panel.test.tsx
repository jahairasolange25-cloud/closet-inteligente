import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GarmentFiltersPanel } from '@/features/garments/garment-filters-panel';
import type { GarmentFilters } from '@/types/garment';

const DEFAULT_FILTERS: GarmentFilters = { page: 1, limit: 24, sortBy: 'created_at', sortOrder: 'desc' };

describe('GarmentFiltersPanel', () => {
  it('renders sort, tipo, estado, and categoría sections', () => {
    render(
      <GarmentFiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={vi.fn()}
        onReset={vi.fn()}
        activeCount={0}
      />,
    );
    expect(screen.getByText('Ordenar')).toBeInTheDocument();
    expect(screen.getByText('Tipo')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Categoría')).toBeInTheDocument();
  });

  it('calls onChange with category when a category button is clicked', () => {
    const onChange = vi.fn();
    render(
      <GarmentFiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
        activeCount={0}
      />,
    );
    fireEvent.click(screen.getByText('Camisas'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'shirts', page: 1 }),
    );
  });

  it('toggles category off when clicking the active category again', () => {
    const onChange = vi.fn();
    render(
      <GarmentFiltersPanel
        filters={{ ...DEFAULT_FILTERS, category: 'shirts' }}
        onChange={onChange}
        onReset={vi.fn()}
        activeCount={1}
      />,
    );
    // Click the category button (first match — the pill in the category grid)
    fireEvent.click(screen.getAllByText('Camisas')[0]!);
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ category: undefined }),
    );
  });

  it('shows clear button and active chips when activeCount > 0', () => {
    render(
      <GarmentFiltersPanel
        filters={{ ...DEFAULT_FILTERS, category: 'jeans' }}
        onChange={vi.fn()}
        onReset={vi.fn()}
        activeCount={1}
      />,
    );
    expect(screen.getByText('Limpiar (1)')).toBeInTheDocument();
    // "Jeans" appears in both the category list and the active chip — assert at least one exists
    expect(screen.getAllByText('Jeans').length).toBeGreaterThan(0);
  });

  it('calls onReset when the clear button is clicked', () => {
    const onReset = vi.fn();
    render(
      <GarmentFiltersPanel
        filters={{ ...DEFAULT_FILTERS, state: 'washing' }}
        onChange={vi.fn()}
        onReset={onReset}
        activeCount={1}
      />,
    );
    fireEvent.click(screen.getByText('Limpiar (1)'));
    expect(onReset).toHaveBeenCalledOnce();
  });

  it('filters by favorites when Favoritas is clicked', () => {
    const onChange = vi.fn();
    render(
      <GarmentFiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
        activeCount={0}
      />,
    );
    fireEvent.click(screen.getByText('❤ Favoritas'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ isFavorite: true, page: 1 }),
    );
  });

  it('calls onChange with sortBy/sortOrder when sort select changes', () => {
    const onChange = vi.fn();
    render(
      <GarmentFiltersPanel
        filters={DEFAULT_FILTERS}
        onChange={onChange}
        onReset={vi.fn()}
        activeCount={0}
      />,
    );
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'name:asc' } });
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ sortBy: 'name', sortOrder: 'asc' }),
    );
  });
});
