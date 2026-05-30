'use client';

import { useEffect } from 'react';
import { Bell, Check, CheckCheck, Shirt, Sparkles, Info } from 'lucide-react';
import { useNotificationStore } from '@/stores/notification-store';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/cn';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const typeIcons: Record<string, React.ReactNode> = {
  garment_processed: <Shirt className="h-4 w-4 text-primary-500" />,
  outfit_reminder: <Sparkles className="h-4 w-4 text-accent-500" />,
  recommendation: <Sparkles className="h-4 w-4 text-secondary-500" />,
  system: <Info className="h-4 w-4 text-info-500" />,
  sync: <Info className="h-4 w-4 text-neutral-400" />,
};

export function NotificationsPage() {
  const { notifications, unreadCount, isLoading, fetchNotifications, markRead, markAllRead } = useNotificationStore();

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-neutral-800 dark:text-neutral-100">Notificaciones</h1>
          {unreadCount > 0 && <p className="text-sm text-neutral-500 mt-0.5">{unreadCount} sin leer</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" leftIcon={<CheckCheck className="h-4 w-4" />} onClick={markAllRead}>
            Marcar todo como leído
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
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
      ) : notifications.length === 0 ? (
        <EmptyState icon={<Bell className="h-8 w-8" />} title="Sin notificaciones" description="Aquí aparecerán tus notificaciones" />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              padding="md"
              hover
              onClick={() => !n.isRead && markRead(n.id)}
              className={cn(
                'flex items-start gap-4 cursor-pointer',
                !n.isRead && 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10',
              )}
            >
              <div className="h-10 w-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
                {typeIcons[n.type] ?? <Bell className="h-4 w-4 text-neutral-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn('text-sm font-medium text-neutral-800 dark:text-neutral-100', !n.isRead && 'font-semibold')}>
                    {n.title}
                  </p>
                  {!n.isRead && <Badge variant="primary" className="text-[10px] flex-shrink-0">Nueva</Badge>}
                </div>
                <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">{n.body}</p>
                <p className="text-xs text-neutral-400 mt-1">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                </p>
              </div>
              {!n.isRead && (
                <button
                  onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                  aria-label="Marcar como leída"
                  className="text-neutral-400 hover:text-primary-500 transition-colors flex-shrink-0"
                >
                  <Check className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
