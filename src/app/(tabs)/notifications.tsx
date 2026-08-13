import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import { HitSlop, Radius, Spacing, Typography } from '@/constants/theme';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '@/features/notifications/useNotifications';
import type { AppNotification, NotificationType } from '@/types/models';
import { formatRelativeDate } from '@/utils/format';

const ICONS: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  new_follower: 'person-add',
  new_rating: 'star',
  listing_liked: 'heart',
  pro_request_approved: 'ribbon',
  pro_request_rejected: 'alert-circle',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  function handlePress(notification: AppNotification) {
    if (!notification.read) markRead.mutate(notification.id);
    if (notification.data?.uid) {
      router.push({ pathname: '/user/[id]', params: { id: notification.data.uid } });
    }
  }

  return (
    <Screen padded={false}>
      <ScreenHeader
        title="Avisos"
        subtitle={unreadCount > 0 ? `${unreadCount} sin leer` : undefined}
        action={
          unreadCount > 0 ? (
            <Pressable
              onPress={() => notifications && markAllRead.mutate(notifications)}
              hitSlop={HitSlop.medium}
              accessibilityRole="button"
              accessibilityLabel="Marcar todos los avisos como leídos"
            >
              <Text style={styles.markAll}>Marcar todo</Text>
            </Pressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.item,
                !item.read && styles.itemUnread,
                pressed && styles.itemPressed,
              ]}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.read ? '' : 'Sin leer. '}${item.title}. ${item.body}`}
            >
              <View style={[styles.iconWrapper, !item.read && styles.iconWrapperUnread]}>
                <Ionicons
                  name={ICONS[item.type] ?? 'notifications'}
                  size={18}
                  color={Colors.primaryInk}
                />
              </View>
              <View style={styles.itemBody}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemBodyText}>{item.body}</Text>
                <Text style={styles.itemDate}>{formatRelativeDate(item.createdAt)}</Text>
              </View>
              {!item.read ? <View style={styles.dot} /> : null}
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-outline"
              title="No tenés avisos todavía"
              subtitle="Te avisamos cuando alguien empiece a seguirte o te deje una calificación."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  markAll: {
    ...Typography.micro,
    color: Colors.primaryInk,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
  },
  itemPressed: {
    backgroundColor: Colors.primarySoft,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperUnread: {
    backgroundColor: Colors.primarySoft,
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    ...Typography.bodyStrong,
    fontSize: 14,
  },
  itemBodyText: {
    ...Typography.caption,
  },
  itemDate: {
    ...Typography.micro,
    marginTop: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    marginTop: Spacing.sm,
  },
});
