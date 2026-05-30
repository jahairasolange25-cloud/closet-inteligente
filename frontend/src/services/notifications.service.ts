import { api } from '@/lib/api';
import type { Notification, NotificationPreferences } from '@/types/notification';
import type { PaginatedResponse } from '@/types/api';

export const notificationsService = {
  async list(page = 1): Promise<PaginatedResponse<Notification>> {
    const { data } = await api.get<PaginatedResponse<Notification>>('/notifications', {
      params: { page, limit: 20 },
    });
    return data;
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const { data } = await api.get<NotificationPreferences>('/notifications/preferences');
    return data;
  },

  async updatePreferences(prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data } = await api.patch<NotificationPreferences>('/notifications/preferences', prefs);
    return data;
  },
};
