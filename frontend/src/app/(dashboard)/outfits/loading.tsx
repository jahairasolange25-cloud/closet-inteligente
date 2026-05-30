import { Skeleton } from '@/components/ui/skeleton';

export default function OutfitsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <Skeleton variant="line" className="h-8 w-32" />
        <Skeleton variant="line" className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-40" />
        ))}
      </div>
    </div>
  );
}
