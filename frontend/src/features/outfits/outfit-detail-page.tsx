'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Trash2, Shirt, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useOutfit, useUpdateOutfit, useDeleteOutfit } from '@/hooks/use-outfits';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Modal } from '@/components/ui/modal';

interface Props { id: string }

export function OutfitDetailPage({ id }: Props) {
  const router = useRouter();
  const { data: outfit, isLoading } = useOutfit(id);
  const updateMutation = useUpdateOutfit(id);
  const deleteMutation = useDeleteOutfit();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return (
    <div className="max-w-4xl flex flex-col gap-6">
      <Skeleton variant="line" className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton variant="rect" className="aspect-square" />
        <Skeleton variant="rect" className="h-64" />
      </div>
    </div>
  );

  if (!outfit) return (
    <div className="text-center py-16">
      <p className="text-neutral-500">Outfit no encontrado</p>
      <Link href="/outfits"><Button variant="outline" size="sm" className="mt-4">← Volver</Button></Link>
    </div>
  );

  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/outfits">
            <Button variant="ghost" size="icon-sm" aria-label="Volver"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">{outfit.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost" size="icon-sm"
            aria-label={outfit.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            onClick={() => updateMutation.mutate({ isFavorite: !outfit.isFavorite })}
          >
            <Heart className={outfit.isFavorite ? 'fill-error-500 text-error-500 h-5 w-5' : 'h-5 w-5'} aria-hidden />
          </Button>
          <Button variant="ghost" size="icon-sm" className="text-error-500 hover:bg-error-50" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Garments preview */}
        <Card padding="md">
          <CardHeader><CardTitle>Prendas ({outfit.garments.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {outfit.garments.map((g) => (
                <Link key={g.id} href={`/garments/${g.id}`}>
                  <div className="relative aspect-square rounded-xl bg-neutral-100 dark:bg-neutral-800 overflow-hidden hover:ring-2 hover:ring-primary-500 transition-all">
                    {g.thumbnailUrl ? (
                      <Image src={g.thumbnailUrl} alt={g.name} fill sizes="33vw" className="object-cover" loading="lazy" placeholder="blur" blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEADkD+JaQAA3AAAAAA" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Shirt className="h-6 w-6 text-neutral-400" aria-hidden />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 truncate text-center">{g.name}</p>
                </Link>
              ))}
              {outfit.garments.length === 0 && (
                <div className="col-span-3 text-center py-6">
                  <Sparkles className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-400">Sin prendas</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card padding="md">
          <CardHeader><CardTitle>Detalles</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              { label: 'Tipo', value: outfit.type },
              { label: 'Ocasión', value: outfit.occasion },
              { label: 'Temporada', value: outfit.season },
            ].filter((a) => a.value).map((attr) => (
              <div key={attr.label} className="flex justify-between gap-2">
                <span className="text-sm text-neutral-500">{attr.label}</span>
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300 capitalize">{attr.value}</span>
              </div>
            ))}
            {outfit.notes && (
              <div>
                <span className="text-sm text-neutral-500">Notas</span>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">{outfit.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Eliminar outfit" size="sm"
        footer={<>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
          <Button variant="danger" size="sm" loading={deleteMutation.isPending}
            onClick={async () => { await deleteMutation.mutateAsync(id); router.push('/outfits'); }}>
            Eliminar
          </Button>
        </>}>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          ¿Eliminar el outfit <strong>{outfit.name}</strong>? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
