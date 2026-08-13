import { Link, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useFollowers } from '@/features/users/useUserProfile';

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: followers, isLoading } = useFollowers(id);

  if (isLoading) return <LoadingView />;

  return (
    <Screen padded={false}>
      <FlatList
        data={followers ?? []}
        keyExtractor={(item) => item.uid}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Link href={{ pathname: '/user/[id]', params: { id: item.uid } }} asChild>
            <Pressable style={styles.row}>
              <Avatar url={item.avatarUrl} name={item.displayName} size={44} />
              <Text style={styles.name}>{item.displayName}</Text>
              <Text style={styles.username}>@{item.username}</Text>
            </Pressable>
          </Link>
        )}
        ListEmptyComponent={<EmptyState icon="people-outline" title="Todavía no tiene seguidores" />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 4,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  username: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
