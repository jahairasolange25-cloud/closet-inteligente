import { cn } from '@/lib/cn';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
  width?: string;
  height?: string;
  count?: number;
}

export function Skeleton({ className, variant = 'rect', width, height, count = 1 }: SkeletonProps) {
  const items = Array.from({ length: count });
  return (
    <>
      {items.map((_, i) => (
        <div
          key={i}
          role="status"
          aria-label="Loading..."
          style={{ width, height }}
          className={cn(
            'shimmer-bg',
            variant === 'circle' && 'rounded-full',
            variant === 'line' && 'rounded-md h-4',
            variant === 'rect' && 'rounded-2xl',
            className,
          )}
        />
      ))}
    </>
  );
}

export function GarmentCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton variant="rect" className="aspect-square w-full" />
      <Skeleton variant="line" className="w-3/4 h-4" />
      <Skeleton variant="line" className="w-1/2 h-3" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6" role="status" aria-label="Loading page...">
      <Skeleton variant="line" className="h-8 w-48" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => <GarmentCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
