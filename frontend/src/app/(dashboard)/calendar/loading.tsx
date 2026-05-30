import { Skeleton } from '@/components/ui/skeleton';

export default function CalendarLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Skeleton variant="line" className="h-8 w-40" />
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-6 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} variant="rect" className="aspect-square sm:h-20" />
          ))}
        </div>
      </div>
    </div>
  );
}
