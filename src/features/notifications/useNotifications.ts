import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { AppNotification } from '@/types/models';

import { getNotifications, markAllNotificationsRead, markNotificationRead } from './notificationsApi';

export function useNotifications() {
  const uid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: queryKeys.notifications(uid ?? 'unknown'),
    queryFn: () => getNotifications(uid as string),
    enabled: Boolean(uid),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return markNotificationRead(uid, notificationId);
    },
    onSuccess: () => {
      if (uid) void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(uid) });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notifications: AppNotification[]) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return markAllNotificationsRead(uid, notifications);
    },
    onSuccess: () => {
      if (uid) void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(uid) });
    },
  });
}
