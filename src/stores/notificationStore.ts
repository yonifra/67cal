import { create } from 'zustand';
import { Timestamp } from 'firebase/firestore';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: 'event_time_changed' | 'event_cancelled';
  calendarId: string;
  calendarTitle: string;
  eventId: string;
  eventTitle: string;
  changes?: {
    previousStart: Timestamp;
    newStart: Timestamp;
    previousEnd: Timestamp;
    newEnd: Timestamp;
  };
  cancelReason?: string;
  actorName: string;
  read: boolean;
  createdAt: Timestamp;
}

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  setNotifications: (notifications: AppNotification[]) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  loading: true,
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loading: false,
    }),
  markAsRead: (id) =>
    set((state) => {
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      return {
        notifications,
        unreadCount: notifications.filter((n) => !n.read).length,
      };
    }),
  markAllAsRead: () =>
    set((state) => {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
      return { notifications, unreadCount: 0 };
    }),
}));
