'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Shirt, Sparkles, CalendarDays, User2 } from 'lucide-react';
import { cn } from '@/lib/cn';

const items = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Closet', href: '/garments', icon: Shirt },
  { label: 'Outfits', href: '/outfits', icon: Sparkles },
  { label: 'Agenda', href: '/calendar', icon: CalendarDays },
  { label: 'Perfil', href: '/profile', icon: User2 },
];

export function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname?.startsWith(href));

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-header md:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 safe-area-inset-bottom"
      aria-label="Navegación móvil"
    >
      <ul className="flex items-center h-16" role="list">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 h-full w-full transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500',
                  active
                    ? 'text-primary-500 dark:text-primary-400'
                    : 'text-neutral-400 dark:text-neutral-500',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-6 w-6" aria-hidden />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
