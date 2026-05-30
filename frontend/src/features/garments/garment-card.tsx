'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Shirt, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { useUpdateGarment } from '@/hooks/use-garments';
import type { Garment } from '@/types/garment';

const stateLabels: Record<string, string> = {
  available: 'Disponible',
  washing: 'Lavando',
  damaged: 'Dañada',
  storage: 'Guardada',
  for_sale: 'En venta',
  donated: 'Donada',
};

const stateBadgeVariant: Record<string, 'default' | 'success' | 'warning' | 'error' | 'primary'> = {
  available: 'success',
  washing: 'warning',
  damaged: 'error',
  storage: 'default',
  for_sale: 'primary',
  donated: 'default',
};

interface GarmentCardProps {
  garment: Garment;
}

function GarmentImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
      className="object-cover"
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEADkD+JaQAA3AAAAAA"
    />
  );
}

export function GarmentCard({ garment }: GarmentCardProps) {
  const update = useUpdateGarment(garment.id);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    update.mutate({ isFavorite: !garment.isFavorite });
  };

  return (
    <Link href={`/garments/${garment.id}`} className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded-2xl">
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800">
          {garment.thumbnailUrl ?? garment.imageUrl ? (
            <GarmentImage
              src={(garment.thumbnailUrl ?? garment.imageUrl)!}
              alt={garment.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Shirt className="h-12 w-12 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </div>
          )}

          {/* Pipeline status */}
          {garment.pipelineStatus === 'processing' && (
            <div className="absolute top-2 left-2">
              <Badge variant="warning" className="text-[10px]">
                <Clock className="h-3 w-3 mr-1" />Procesando
              </Badge>
            </div>
          )}
          {garment.pipelineStatus === 'failed' && (
            <div className="absolute top-2 left-2">
              <Badge variant="error" className="text-[10px]">
                <AlertCircle className="h-3 w-3 mr-1" />Error
              </Badge>
            </div>
          )}

          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            aria-label={garment.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            aria-pressed={garment.isFavorite}
            className={cn(
              'absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center',
              'opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity',
              'hover:bg-white dark:hover:bg-neutral-900',
            )}
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors',
                garment.isFavorite ? 'fill-error-500 text-error-500' : 'text-neutral-400',
              )}
              aria-hidden
            />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{garment.name}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-500 capitalize">{garment.category}</p>
            {garment.state !== 'available' && (
              <Badge variant={stateBadgeVariant[garment.state] ?? 'default'} className="text-[10px]">
                {stateLabels[garment.state]}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
