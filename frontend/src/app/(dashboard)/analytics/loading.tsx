import { Skeleton } from '@/components/ui/skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <Skeleton variant="line" className="h-8 w-40" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="rect" className="h-24" />
        ))}
      </div>
      <Skeleton variant="rect" className="h-64" />
    </div>
  );
}
