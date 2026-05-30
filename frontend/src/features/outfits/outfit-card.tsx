'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, Sparkles, Shirt } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { useUpdateOutfit } from '@/hooks/use-outfits';
import type { Outfit } from '@/types/outfit';

interface OutfitCardProps {
  outfit: Outfit;
}

export function OutfitCard({ outfit }: OutfitCardProps) {
  const update = useUpdateOutfit(outfit.id);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    update.mutate({ isFavorite: !outfit.isFavorite });
  };

  const preview = outfit.garments.slice(0, 4);

  return (
    <Link href={`/outfits/${outfit.id}`} className="group block">
      <div className="rounded-2xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Preview grid */}
        <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 grid grid-cols-2 gap-0.5">
          {preview.length === 0 ? (
            <div className="col-span-2 row-span-2 flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-neutral-300 dark:text-neutral-600" aria-hidden />
            </div>
          ) : (
            preview.map((g, _i) => (
              <div key={g.id} className={cn('relative bg-neutral-200 dark:bg-neutral-700 overflow-hidden', preview.length === 1 && 'col-span-2 row-span-2')}>
                {g.thumbnailUrl ? (
                  <Image src={g.thumbnailUrl} alt={g.name} fill sizes="25vw" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Shirt className="h-6 w-6 text-neutral-400" aria-hidden />
                  </div>
                )}
              </div>
            ))
          )}
          <button
            onClick={toggleFavorite}
            aria-label={outfit.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            aria-pressed={outfit.isFavorite}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 dark:bg-neutral-900/80 flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          >
            <Heart className={cn('h-4 w-4', outfit.isFavorite ? 'fill-error-500 text-error-500' : 'text-neutral-400')} aria-hidden />
          </button>
        </div>

        <div className="p-3 flex flex-col gap-1">
          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{outfit.name}</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-neutral-500">{outfit.garments.length} prenda{outfit.garments.length !== 1 ? 's' : ''}</p>
            {outfit.occasion && <Badge variant="default" className="text-[10px]">{outfit.occasion}</Badge>}
          </div>
        </div>
      </div>
    </Link>
  );
}
