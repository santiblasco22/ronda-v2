import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { useFollowingFeed } from '@/features/discovery/useDiscovery';
import { useFollowing } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import type { Listing } from '@/types/models';

export default function FollowingFeedScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.firebaseUid);
  const { data: following } = useFollowing(uid ?? undefined);
  const { data: listings, isLoading, isFetching, refetch } = useFollowingFeed();

  const followsNobody = (following?.length ?? 0) === 0;

  return (
    <Screen padded={false}>
      <ScreenHeader title="Siguiendo" subtitle="Lo último de los vendedores que seguís" />
      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={listings ?? []}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.column}
          refreshControl={
            <RefreshControl
              refreshing={isFetching}
              onRefresh={refetch}
              tintColor={Colors.primaryInk}
            />
          }
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            followsNobody ? (
              <EmptyState
                icon="people-outline"
                title="Todavía no seguís a nadie"
                subtitle="Cuando sigas vendedores, sus prendas nuevas aparecen acá primero. Empezá deslizando en Descubrir o buscando por ciudad."
                actionLabel="Descubrir vendedores"
                onAction={() => router.push('/(tabs)')}
              />
            ) : (
              <EmptyState
                icon="shirt-outline"
                title="Sin novedades por ahora"
                subtitle="Los vendedores que seguís no tienen publicaciones activas. Probá buscar prendas nuevas mientras tanto."
                actionLabel="Ir a Buscar"
                onAction={() => router.push('/(tabs)/search')}
              />
            )
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  column: {
    gap: Spacing.lg,
  },
});
