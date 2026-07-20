import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase/config';
import { Notification } from '../types';
import { useAuth } from './useAuth';
import { playNotificationSound, sendBrowserNotification, isSoundEnabled } from '../lib/notifications';

/**
 * Custom Hook useNotifications
 * Synchronizes list of notifications for the currently logged-in user in real-time.
 */
export function useNotifications(userId: string | undefined) {
  const { userProfile, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!userId || !userProfile) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notificationsRef = collection(db, 'notifications');
    
    // Choose the appropriate query according to the user's role
    let q;
    if (userProfile.role === 'super_admin' || userProfile.role === 'admin') {
      q = query(
        notificationsRef,
        orderBy('createdAt', 'desc')
      );
    } else if (userProfile.role === 'chef_point' && userProfile.branchId) {
      q = query(
        notificationsRef,
        where('branchId', '==', userProfile.branchId),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        notificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
    }

    let isInitialLoad = true;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: Notification[] = [];
        snapshot.forEach((docSnap) => {
          items.push({ id: docSnap.id, ...docSnap.data() } as Notification);
        });

        // Compute unread count
        const unread = items.filter(n => !n.read).length;

        // If it's not the initial state load, handle new notifications
        if (!isInitialLoad) {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const newNotif = { id: change.doc.id, ...change.doc.data() } as Notification;
              if (!newNotif.read) {
                // Play sound if enabled
                if (isSoundEnabled()) {
                  let soundType: 'new_order' | 'quote_response' | 'status_update' = 'status_update';
                  if (newNotif.type === 'new_order') {
                    soundType = 'new_order';
                  } else if (newNotif.type === 'quote_responded' || newNotif.type === 'quote_received') {
                    soundType = 'quote_response';
                  }
                  playNotificationSound(soundType);
                }
                // Send browser system notification
                sendBrowserNotification(newNotif.title, newNotif.message);
              }
            }
          });
        }

        setNotifications(items);
        setUnreadCount(unread);
        setLoading(false);
        isInitialLoad = false;
      },
      (err) => {
        console.error("Erreur de synchronisation des notifications:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, userProfile, authLoading]);

  /**
   * Mark a specific notification as read
   */
  const markAsRead = async (notificationId: string) => {
    if (!notificationId) return;
    try {
      const notifRef = doc(db, 'notifications', notificationId);
      await updateDoc(notifRef, { read: true });
    } catch (err) {
      console.error("Erreur marquage notification lue:", err);
    }
  };

  /**
   * Mark all unread notifications of the user as read
   */
  const markAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.read);
      if (unreadNotifs.length === 0) return;

      const batch = writeBatch(db);
      unreadNotifs.forEach((n) => {
        if (n.id) {
          const notifRef = doc(db, 'notifications', n.id);
          batch.update(notifRef, { read: true });
        }
      });
      await batch.commit();
    } catch (err) {
      console.error("Erreur marquage global notifications lues:", err);
    }
  };

  return { unreadCount, notifications, markAsRead, markAllAsRead, loading };
}
