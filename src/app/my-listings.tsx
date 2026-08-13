import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { getListingCapFor } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useMyListings } from '@/features/listings/useListings';
import { useAuthStore } from '@/store/authStore';
import type { Listing, ListingStatus } from '@/types/models';

const FILTERS: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'sold', label: 'Vendidas' },
  { value: 'archived', label: 'Archivadas' },
];

const EMPTY_COPY: Record<ListingStatus | 'all', { title: string; subtitle: string }> = {
  all: {
    title: 'Todavía no publicaste nada',
    subtitle: 'Tu primera prenda puede estar lista en un minuto: título, precio, talle y estado.',
  },
  active: {
    title: 'No tenés publicaciones activas',
    subtitle: 'Reactivá alguna archivada o publicá una prenda nueva para que aparezca en Descubrir.',
  },
  sold: {
    title: 'Todavía no marcaste nada como vendido',
    subtitle: 'Cuando cierres una venta, marcala como vendida para liberar cupo de tu plan.',
  },
  archived: {
    title: 'No tenés publicaciones archivadas',
    subtitle: 'Archivar es la forma de guardar una prenda sin ocupar cupo de tu plan.',
  },
};

export default function MyListingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings, isLoading } = useMyListings();
  const [filter, setFilter] = useState<ListingStatus | 'all'>('all');

  const filtered = (listings ?? []).filter((l) => filter === 'all' || l.status === filter);
  const cap = profile ? getListingCapFor(profile.isPro) : 0;
  const active = profile?.activeListingCount ?? 0;
  const emptyCopy = EMPTY_COPY[filter];

  return (
    <Screen padded={false}>
      {profile ? (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {active} de {cap} publicaciones activas
          </Text>
          <View style={styles.meter} accessibilityLabel={`${active} de ${cap} publicaciones activas`}>
            <View style={[styles.meterFill, { width: `${Math.min((active / cap) * 100, 100)}%` }]} />
          </View>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {FILTERS.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={filter === option.value}
            onPress={() => setFilter(option.value)}
          />
        ))}
      </View>

      {isLoading ? (
        <LoadingView />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }: { item: Listing }) => (
            <Pressable
              style={styles.cardWrapper}
              onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: item.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Editar ${item.title}`}
            >
              <ListingCard listing={item} showStatus />
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="shirt-outline"
              title={emptyCopy.title}
              subtitle={emptyCopy.subtitle}
              actionLabel="Publicar prenda"
              onAction={() => router.push('/listing/new')}
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  summaryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  meter: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
    flexGrow: 1,
  },
  column: {
    gap: Spacing.lg,
  },
  cardWrapper: {
    flex: 1,
  },
});
