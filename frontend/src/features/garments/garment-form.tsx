'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGarmentSchema, type CreateGarmentFormData } from '@/lib/validations/garment';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Garment, GarmentCategory } from '@/types/garment';

const CATEGORIES: { value: GarmentCategory; label: string }[] = [
  { value: 'shirts', label: 'Camisas' },
  { value: 'blouses', label: 'Blusas' },
  { value: 'tshirts', label: 'Camisetas' },
  { value: 'sweaters', label: 'Suéteres' },
  { value: 'hoodies', label: 'Hoodies' },
  { value: 'jackets', label: 'Chaquetas' },
  { value: 'coats', label: 'Abrigos' },
  { value: 'sportswear', label: 'Ropa deportiva' },
  { value: 'formalwear', label: 'Ropa formal' },
  { value: 'pants', label: 'Pantalones' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'skirts', label: 'Faldas' },
  { value: 'dresses', label: 'Vestidos' },
  { value: 'jumpsuits', label: 'Monos' },
  { value: 'suits', label: 'Trajes' },
  { value: 'sneakers', label: 'Zapatillas' },
  { value: 'boots', label: 'Botas' },
  { value: 'heels', label: 'Tacones' },
  { value: 'sandals', label: 'Sandalias' },
  { value: 'flats', label: 'Zapatos planos' },
  { value: 'bags', label: 'Bolsos' },
  { value: 'hats', label: 'Sombreros' },
  { value: 'other', label: 'Otro' },
];

interface GarmentFormProps {
  defaultValues?: Partial<Garment>;
  onSubmit: (data: CreateGarmentFormData) => Promise<void>;
  isLoading?: boolean;
  submitLabel?: string;
  error?: string | null;
  onRetry?: () => void;
}

export function GarmentForm({ defaultValues, onSubmit, isLoading, submitLabel = 'Guardar', error, onRetry }: GarmentFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateGarmentFormData>({
    resolver: zodResolver(createGarmentSchema),
    defaultValues: defaultValues
      ? {
          name: defaultValues.name,
          category: defaultValues.category,
          color: defaultValues.color ?? undefined,
          brand: defaultValues.brand ?? undefined,
          size: defaultValues.size ?? undefined,
          notes: defaultValues.notes ?? undefined,
        }
      : undefined,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <Input label="Nombre" required error={errors.name?.message} {...register('name')} />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Categoría <span className="text-error-500">*</span>
        </label>
        <select
          id="category"
          className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm text-neutral-800 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40"
          aria-invalid={!!errors.category}
          {...register('category')}
        >
          <option value="">Seleccionar categoría</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        {errors.category && (
          <p className="text-xs font-medium text-error-600" role="alert">{errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Color" placeholder="ej. azul marino" error={errors.color?.message} {...register('color')} />
        <Input label="Marca" placeholder="ej. Zara" error={errors.brand?.message} {...register('brand')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Talla" placeholder="ej. M, 38, L" error={errors.size?.message} {...register('size')} />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Notas</label>
        <textarea
          id="notes"
          rows={3}
          aria-label="Notas de la prenda"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40 resize-none"
          {...register('notes')}
        />
      </div>

      {error && (
        <div className="flex flex-col gap-2" role="alert">
          <p className="text-xs text-error-600 dark:text-error-400">{error}</p>
          {onRetry && (
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Reintentar
            </Button>
          )}
        </div>
      )}

      <Button type="submit" loading={isLoading} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
