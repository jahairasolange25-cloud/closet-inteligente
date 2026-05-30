import { create } from 'zustand';
import { notificationsService } from '@/services/notifications.service';
import { extractError } from '@/lib/api';
import type { Notification, NotificationPreferences } from '@/types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;

  fetchNotifications: (page?: number) => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (data: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (n: Notification) => void;
  setUnreadCount: (count: number) => void;
  clearError: () => void;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,

  fetchNotifications: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const result = await notificationsService.list(page);
      const unreadCount = result.data.filter((n) => !n.isRead).length;
      set({ notifications: result.data, unreadCount, isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try {
      await notificationsService.markRead(id);
    } catch {
      get().fetchNotifications();
    }
  },

  markAllRead: async () => {
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await notificationsService.markAllRead();
    } catch {
      get().fetchNotifications();
    }
  },

  fetchPreferences: async () => {
    try {
      const preferences = await notificationsService.getPreferences();
      set({ preferences });
    } catch (err) {
      set({ error: extractError(err) });
    }
  },

  updatePreferences: async (data) => {
    try {
      const preferences = await notificationsService.updatePreferences(data);
      set({ preferences });
    } catch (err) {
      set({ error: extractError(err) });
    }
  },

  addNotification: (n) =>
    set((s) => ({
      notifications: [n, ...s.notifications],
      unreadCount: s.unreadCount + 1,
    })),

  setUnreadCount: (count) => set({ unreadCount: count }),
  clearError: () => set({ error: null }),
}));
