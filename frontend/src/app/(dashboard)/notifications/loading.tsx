import { Skeleton } from '@/components/ui/skeleton';

export default function NotificationsLoading() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <Skeleton variant="line" className="h-8 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <Skeleton variant="circle" className="h-10 w-10 flex-shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton variant="line" className="h-4 w-3/4" />
            <Skeleton variant="line" className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
