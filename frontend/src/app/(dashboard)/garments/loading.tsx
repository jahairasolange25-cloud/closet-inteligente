import { GarmentCardSkeleton } from '@/components/ui/skeleton';

export default function GarmentsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
        <div className="h-9 w-28 bg-neutral-200 dark:bg-neutral-800 rounded-lg animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <GarmentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
