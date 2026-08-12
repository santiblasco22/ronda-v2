import { collection, doc, getDocs, orderBy, query, updateDoc } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { AppNotification } from '@/types/models';

export async function getNotifications(uid: string): Promise<AppNotification[]> {
  const q = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      type: data.type as AppNotification['type'],
      title: data.title as string,
      body: data.body as string,
      read: Boolean(data.read),
      createdAt: Number(data.createdAt ?? Date.now()),
      data: (data.data as Record<string, string>) ?? undefined,
    };
  });
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'notifications', notificationId), { read: true });
}

export async function markAllNotificationsRead(uid: string, notifications: AppNotification[]): Promise<void> {
  await Promise.all(
    notifications.filter((n) => !n.read).map((n) => markNotificationRead(uid, n.id))
  );
}
