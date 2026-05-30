import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  overlay?: boolean;
  label?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };

export function Spinner({ size = 'md', className, overlay, label = 'Loading...' }: SpinnerProps) {
  const icon = (
    <Loader2
      className={cn('animate-spin text-primary-500', sizeMap[size], className)}
      aria-hidden="true"
    />
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-loading flex items-center justify-center bg-white/60 dark:bg-neutral-950/60 backdrop-blur-sm" role="status" aria-label={label}>
        {icon}
      </div>
    );
  }

  return (
    <span role="status" aria-label={label} className="inline-flex">
      {icon}
    </span>
  );
}
