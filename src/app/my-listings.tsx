import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Chip } from '@/components/Chip';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { getListingCapFor } from '@/constants/limits';
import { useMyListings } from '@/features/listings/useListings';
import { useAuthStore } from '@/store/authStore';
import type { Listing, ListingStatus } from '@/types/models';

const FILTERS: { value: ListingStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'sold', label: 'Vendidas' },
  { value: 'archived', label: 'Archivadas' },
];

export default function MyListingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings, isLoading } = useMyListings();
  const [filter, setFilter] = useState<ListingStatus | 'all'>('all');

  const filtered = (listings ?? []).filter((l) => filter === 'all' || l.status === filter);
  const cap = profile ? getListingCapFor(profile.isPro) : 0;

  return (
    <Screen padded={false}>
      <View style={styles.summary}>
        <Text style={styles.summaryText}>
          {profile ? `${profile.activeListingCount}/${cap} publicaciones activas` : ''}
        </Text>
      </View>

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
            <Pressable onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: item.id } })}>
              <ListingCard listing={item} showStatus />
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState icon="shirt-outline" title="No hay publicaciones en esta categoría" />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  summaryText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
});
