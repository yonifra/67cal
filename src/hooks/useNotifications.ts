'use client';

import { useEffect } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationStore, AppNotification } from '@/stores/notificationStore';

export function useNotifications() {
  const user = useAuthStore((s) => s.user);
  const { notifications, unreadCount, loading, setNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs: AppNotification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];
      setNotifications(notifs);
    });

    return unsubscribe;
  }, [user?.uid, setNotifications]);

  const handleMarkAsRead = async (id: string) => {
    markAsRead(id);
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    markAllAsRead();

    try {
      const batch = writeBatch(db);
      for (const id of unreadIds) {
        batch.update(doc(db, 'notifications', id), { read: true });
      }
      await batch.commit();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}
