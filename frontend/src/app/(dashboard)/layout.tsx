import type { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { MobileNav } from '@/components/layout/mobile-nav';
import { AuthProvider } from '@/providers/auth-provider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0">
          <Topbar />
          <main
            className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:pb-6"
            id="main-content"
          >
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthProvider>
  );
}
