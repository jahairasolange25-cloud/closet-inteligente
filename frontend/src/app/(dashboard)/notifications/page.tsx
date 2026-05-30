import type { Metadata } from 'next';
import { NotificationsPage } from '@/features/notifications/notifications-page';

export const metadata: Metadata = { title: 'Notificaciones' };

export default function NotificationsPageRoute() {
  return <NotificationsPage />;
}
