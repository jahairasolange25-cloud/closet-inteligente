'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Shirt, Sparkles, CalendarDays, User2, BarChart3,
  Settings, Bell, LogOut, ChevronLeft, ChevronRight, Wifi, WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { label: 'Inicio', href: '/', icon: Home, section: 'main' },
  { label: 'Mi Closet', href: '/garments', icon: Shirt, section: 'wardrobe' },
  { label: 'Outfits', href: '/outfits', icon: Sparkles, section: 'wardrobe' },
  { label: 'Planificador', href: '/calendar', icon: CalendarDays, section: 'wardrobe' },
  { label: 'Mi Avatar', href: '/avatar', icon: User2, section: 'personal' },
  { label: 'Estadísticas', href: '/analytics', icon: BarChart3, section: 'personal' },
  { label: 'Notificaciones', href: '/notifications', icon: Bell, section: 'account' },
  { label: 'Perfil', href: '/profile', icon: User2, section: 'account' },
  { label: 'Configuración', href: '/settings', icon: Settings, section: 'account' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { isSidebarCollapsed, collapseSidebar, isOffline } = useUIStore();
  const { unreadCount } = useNotificationStore();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname?.startsWith(href);

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 border-r border-neutral-200 dark:border-neutral-800',
        'bg-white dark:bg-neutral-900 transition-all duration-300 z-sidebar',
        isSidebarCollapsed ? 'w-16' : 'w-[280px]',
      )}
      aria-label="Navegación principal"
    >
      {/* Header */}
      <div className={cn('flex items-center gap-3 px-4 h-16 border-b border-neutral-200 dark:border-neutral-800', isSidebarCollapsed && 'justify-center px-2')}>
        {!isSidebarCollapsed && (
          <span className="font-display font-bold text-lg text-primary-600 dark:text-primary-400 truncate">
            Closet ✨
          </span>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => collapseSidebar(!isSidebarCollapsed)}
          aria-label={isSidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          className={cn('ml-auto', isSidebarCollapsed && 'ml-0')}
        >
          {isSidebarCollapsed ? <ChevronRight className="h-4 w-4" aria-hidden /> : <ChevronLeft className="h-4 w-4" aria-hidden />}
        </Button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 no-scrollbar">
        <ul className="flex flex-col gap-1" role="list">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors min-h-[44px]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                    active
                      ? 'bg-primary-50 text-primary-700 font-medium dark:bg-primary-900/20 dark:text-primary-300'
                      : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
                    isSidebarCollapsed && 'justify-center px-2',
                  )}
                  aria-current={active ? 'page' : undefined}
                  title={isSidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden />
                  {!isSidebarCollapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {!isSidebarCollapsed && item.href === '/notifications' && unreadCount > 0 && (
                    <Badge variant="primary" className="text-xs px-1.5 py-0">{unreadCount}</Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-neutral-200 dark:border-neutral-800 p-3', isSidebarCollapsed && 'px-2')}>
        {!isSidebarCollapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate">{user.name}</p>
              <p className="text-xs text-neutral-500 truncate">{user.email}</p>
            </div>
            {isOffline ? <WifiOff className="h-4 w-4 text-warning-500 flex-shrink-0" aria-label="Sin conexión" /> : <Wifi className="h-4 w-4 text-success-500 flex-shrink-0" aria-label="Conectado" />}
          </div>
        )}
        <Button
          variant="ghost"
          size={isSidebarCollapsed ? 'icon' : 'md'}
          onClick={logout}
          className={cn('w-full text-neutral-600 dark:text-neutral-400 hover:text-error-600 dark:hover:text-error-400', isSidebarCollapsed && 'px-2')}
          aria-label="Cerrar sesión"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" aria-hidden />
          {!isSidebarCollapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
}
