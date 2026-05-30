export type NotificationType = 'outfit_reminder' | 'garment_processed' | 'system' | 'recommendation' | 'sync';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data: Record<string, unknown> | null;
  createdAt: string;
}

export interface NotificationPreferences {
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  outfitReminders: boolean;
  garmentProcessingAlerts: boolean;
  recommendations: boolean;
  syncAlerts: boolean;
}
