/**
 * Central Notifications Dispatcher for AI Sentry anomalies,
 * continuous tests, and deployment alerts. Saves into local logs.
 */

export interface SentryNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

const NOTIFICATION_KEY = 'sentry_platform_notifications';

export function getNotifications(): SentryNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'notif-1',
        title: '🤖 Sentry Core Active',
        message: 'إطلاق نظام الحماية التلقائية للوكيل بنجاح.',
        type: 'success',
        timestamp: new Date().toISOString(),
        read: false
      }
    ];
  } catch {
    return [];
  }
}

export function saveNotification(notif: Omit<SentryNotification, 'id' | 'timestamp' | 'read'>): SentryNotification {
  const newNotif: SentryNotification = {
    ...notif,
    id: `notif-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false
  };

  const list = getNotifications();
  list.unshift(newNotif);
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(list.slice(0, 50)));
  return newNotif;
}

export function markAllNotificationsAsRead() {
  const list = getNotifications().map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(list));
}
