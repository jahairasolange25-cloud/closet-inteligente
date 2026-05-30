import { Skeleton } from '@/components/ui/skeleton';

export default function GarmentDetailLoading() {
  return (
    <div className="max-w-4xl flex flex-col gap-6">
      <Skeleton variant="line" className="h-8 w-48" />
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton variant="rect" className="aspect-square" />
        <div className="flex flex-col gap-4">
          <Skeleton variant="rect" className="h-48" />
          <Skeleton variant="rect" className="h-24" />
        </div>
      </div>
    </div>
  );
}
