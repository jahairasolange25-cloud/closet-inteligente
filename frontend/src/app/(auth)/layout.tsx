import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
