import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { useFollowingFeed } from '@/features/discovery/useDiscovery';
import type { Listing } from '@/types/models';

export default function FollowingFeedScreen() {
  const { data: listings, isLoading, isFetching, refetch } = useFollowingFeed();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Siguiendo</Text>
      </View>
      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={listings ?? []}
          key={2}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.column}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="Todavía no seguís a nadie"
              subtitle="Seguí vendedores desde Descubrir o Buscar para ver sus publicaciones aquí."
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
    paddingBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  list: {
    padding: 12,
    flexGrow: 1,
  },
  column: {
    gap: 12,
  },
});
