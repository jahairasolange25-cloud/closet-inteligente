'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Plus, Shirt } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateOutfit } from '@/hooks/use-outfits';
import { useGarments } from '@/hooks/use-garments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GarmentCardSkeleton } from '@/components/ui/skeleton';

const schema = z.object({
  name: z.string().min(1, 'Nombre requerido').max(100),
  type: z.enum(['casual', 'formal', 'office', 'party']),
});

type FormData = z.infer<typeof schema>;

export function NewOutfitPage() {
  const router = useRouter();
  const createMutation = useCreateOutfit();
  const { data: garmentsData, isLoading: gLoading } = useGarments({ limit: 50 });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'casual' },
  });

  const toggleGarment = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);
    try {
      await createMutation.mutateAsync({
        ...data,
        garment_ids: Array.from(selectedIds),
      });
      router.push('/outfits');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error al crear outfit');
    }
  };

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/outfits">
          <Button variant="ghost" size="icon-sm" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Crear Outfit</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Basic info */}
          <Card padding="md">
            <CardHeader><CardTitle>Información</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Input label="Nombre" required error={errors.name?.message} {...register('name')} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Tipo <span className="text-error-500">*</span></label>
                <select className="h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary-500/40" {...register('type')}>
                  {['casual', 'formal', 'office', 'party'].map((t) => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

            </CardContent>
          </Card>

          {/* Selection summary */}
          <Card padding="md">
            <CardHeader><CardTitle>Prendas seleccionadas ({selectedIds.size})</CardTitle></CardHeader>
            <CardContent>
              {selectedIds.size === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">Selecciona prendas del closet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.from(selectedIds).map((id) => {
                    const g = garmentsData?.data.find((g) => g.id === id);
                    if (!g) return null;
                    return (
                      <Badge key={id} variant="primary" className="cursor-pointer" onClick={() => toggleGarment(id)}>
                        {g.name} ✕
                      </Badge>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Garment picker */}
        <Card padding="md">
          <CardHeader><CardTitle>Seleccionar prendas</CardTitle></CardHeader>
          <CardContent>
            {gLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {Array.from({ length: 12 }).map((_, i) => <GarmentCardSkeleton key={i} />)}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {(garmentsData?.data ?? []).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGarment(g.id)}
                    aria-pressed={selectedIds.has(g.id)}
                    aria-label={`${selectedIds.has(g.id) ? 'Deseleccionar' : 'Seleccionar'} ${g.name}`}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedIds.has(g.id)
                        ? 'border-primary-500 ring-2 ring-primary-500/40'
                        : 'border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <div className="relative w-full h-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                      {g.thumbnailUrl ? (
                        <Image src={g.thumbnailUrl} alt={g.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" loading="lazy" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEADkD+JaQAA3AAAAAA" />
                      ) : (
                        <Shirt className="h-6 w-6 text-neutral-400" aria-hidden />
                      )}
                    </div>
                    {selectedIds.has(g.id) && (
                      <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                        <span className="h-6 w-6 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center font-bold">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {submitError && (
          <div role="alert" className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400 bg-error-50 dark:bg-error-900/10 rounded-lg px-4 py-2">
            <span>{submitError}</span>
          </div>
        )}

        <Button type="submit" loading={createMutation.isPending} className="self-end" leftIcon={<Plus className="h-4 w-4" />}>
          Crear Outfit
        </Button>
      </form>
    </div>
  );
}
