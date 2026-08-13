import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
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
      <View style={styles.header}>
        <Text style={styles.title}>Avisos</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={() => notifications && markAllRead.mutate(notifications)}>
            <Text style={styles.markAll}>Marcar todo como leído</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.item, !item.read && styles.itemUnread]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.iconWrapper}>
                <Ionicons name={ICONS[item.type] ?? 'notifications'} size={20} color={Colors.primaryDark} />
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
              subtitle="Te avisaremos cuando alguien te siga o califique."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  markAll: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 10,
    flexGrow: 1,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemUnread: {
    borderColor: Colors.primary,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemBody: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  itemBodyText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  itemDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
});
