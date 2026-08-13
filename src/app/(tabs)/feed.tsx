import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useFollowingFeed } from '@/features/discovery/useDiscovery';
import { useFollowing } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import type { Listing } from '@/types/models';

export default function FollowingFeedScreen() {
  const router = useRouter();
  const uid = useAuthStore((s) => s.firebaseUid);
  const { data: following, isError: isFollowingError, refetch: refetchFollowing } = useFollowing(uid ?? undefined);
  const { data: listings, isLoading, isFetching, isError, refetch } = useFollowingFeed();
  const followsNobody = (following?.length ?? 0) === 0;

  return (
    <Screen padded={false}>
      <ScreenHeader title="Tu ronda" subtitle="Lo nuevo de los roperos que elegiste seguir" />
      {isLoading ? (
        <LoadingView label="Armando tu ronda…" />
      ) : isError || isFollowingError ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="Tu ronda no cargó"
          subtitle="Parece un problema de conexión. Tus seguidos siguen guardados."
          actionLabel="Volver a intentar"
          onAction={() => void Promise.all([refetch(), refetchFollowing()])}
        />
      ) : (
        <FlatList
          data={listings ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={Colors.primaryInk} />}
          ListHeaderComponent={
            listings?.length ? (
              <View style={styles.introCard}>
                <View style={styles.introIcon}>
                  <Ionicons name="people" size={20} color={Colors.plum} />
                </View>
                <View style={styles.introText}>
                  <Text style={styles.introTitle}>Recién llegadas</Text>
                  <Text style={styles.introBody}>{listings.length} {listings.length === 1 ? 'prenda nueva' : 'prendas nuevas'} de tu comunidad</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} variant="feed" />}
          ListEmptyComponent={
            followsNobody ? (
              <EmptyState
                icon="people-outline"
                title="Tu ronda todavía está vacía"
                subtitle="Seguí roperos desde Descubrir o Buscar. Sus prendas nuevas van a aparecer acá."
                actionLabel="Descubrir roperos"
                onAction={() => router.push('/(tabs)')}
              />
            ) : (
              <EmptyState
                icon="shirt-outline"
                title="Estás al día"
                subtitle="Ya viste lo último de quienes seguís. Mientras tanto, date otra vuelta por Buscar."
                actionLabel="Explorar prendas"
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
  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.xl, flexGrow: 1 },
  introCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.butterSoft,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    transform: [{ rotate: '-3deg' }],
  },
  introText: { flex: 1 },
  introTitle: { ...Typography.sectionTitle },
  introBody: { ...Typography.caption },
});
