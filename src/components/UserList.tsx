import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { FollowEdge } from '@/types/models';

import { Avatar } from './Avatar';
import { EmptyState, LoadingView } from './EmptyState';
import { Screen } from './Screen';

/** Lista de personas compartida por las pantallas de seguidores y seguidos. */
export function UserList({
  users,
  isLoading,
  emptyTitle,
  emptySubtitle,
}: {
  users: FollowEdge[] | undefined;
  isLoading: boolean;
  emptyTitle: string;
  emptySubtitle?: string;
}) {
  if (isLoading) return <LoadingView />;

  return (
    <Screen padded={false}>
      <FlatList
        data={users ?? []}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/user/[id]', params: { id: item.uid } }} asChild>
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              accessibilityRole="button"
              accessibilityLabel={`Ver el perfil de ${item.displayName}, @${item.username}`}
            >
              <Avatar url={item.avatarUrl} name={item.displayName} size={44} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.displayName}
                </Text>
                <Text style={styles.username} numberOfLines={1}>
                  @{item.username}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={
          <EmptyState icon="people-outline" title={emptyTitle} subtitle={emptySubtitle} />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.lg,
    gap: Spacing.sm,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowPressed: {
    borderColor: Colors.primary,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyStrong,
    fontSize: 14,
  },
  username: {
    ...Typography.micro,
  },
});
