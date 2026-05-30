'use client';

import { useTheme } from 'next-themes';
import { Bell, Moon, Sun, Monitor, Menu } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { useUIStore } from '@/stores/ui-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { WsStatus } from './ws-status';

interface TopbarProps {
  title?: string;
}

export function Topbar({ title }: TopbarProps) {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { toggleMobileMenu } = useUIStore();
  const { theme, setTheme } = useTheme();

  const nextTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

  return (
    <header
      className={cn(
        'sticky top-0 z-header h-16 flex items-center justify-between gap-4 px-4 sm:px-6',
        'bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md',
        'border-b border-neutral-200 dark:border-neutral-800',
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleMobileMenu}
          className="md:hidden"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </Button>
        {title && (
          <h1 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 font-display">
            {title}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-1">
        <WsStatus />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(nextTheme)}
          aria-label={`Cambiar tema a ${nextTheme}`}
        >
          <ThemeIcon className="h-4 w-4" aria-hidden />
        </Button>

        <Button variant="ghost" size="icon-sm" className="relative" aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}>
          <Bell className="h-4 w-4" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-error-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>

        {user && (
          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-semibold" aria-label={user.name}>
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </header>
  );
}
