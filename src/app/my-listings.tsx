import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

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
  { value: 'active', label: 'En vidriera' },
  { value: 'sold', label: 'Vendidas' },
  { value: 'archived', label: 'Archivadas' },
];

const EMPTY_COPY: Record<ListingStatus | 'all', { title: string; subtitle: string }> = {
  all: { title: 'Tu ropero espera su primera prenda', subtitle: 'Con título, precio, talle y estado ya podés sumarla a la ronda.' },
  active: { title: 'Tu vidriera está vacía', subtitle: 'Reactivá una prenda archivada o publicá algo nuevo para volver a aparecer.' },
  sold: { title: 'Todavía no marcaste ventas', subtitle: 'Cuando una prenda encuentre nueva casa, marcala como vendida para liberar lugar.' },
  archived: { title: 'No guardaste prendas fuera de ronda', subtitle: 'Archivar las oculta sin borrarlas y libera un lugar de tu vidriera.' },
};

export default function MyListingsScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings, isLoading, isError, refetch } = useMyListings();
  const [filter, setFilter] = useState<ListingStatus | 'all'>('all');
  const filtered = (listings ?? []).filter((listing) => filter === 'all' || listing.status === filter);
  const cap = profile ? getListingCapFor(profile.isPro) : 0;
  const active = profile?.activeListingCount ?? 0;
  const emptyCopy = EMPTY_COPY[filter];

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>GESTIONÁ TU VIDRIERA</Text>
        <Text style={styles.title}>Mis prendas</Text>
        {profile ? (
          <View style={styles.summary}>
            <View style={styles.summaryIcon}><Ionicons name="shirt-outline" size={21} color={Colors.plum} /></View>
            <View style={styles.summaryBody}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryText}>{active} activas</Text>
                <Text style={styles.summaryAvailable}>{Math.max(cap - active, 0)} lugares libres</Text>
              </View>
              <View style={styles.meter} accessibilityLabel={`${active} de ${cap} publicaciones activas`}>
                <View style={[styles.meterFill, { width: `${Math.min((active / cap) * 100, 100)}%` }]} />
              </View>
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        {FILTERS.map((option) => <Chip key={option.value} label={option.label} selected={filter === option.value} onPress={() => setFilter(option.value)} />)}
      </View>

      {isLoading ? (
        <LoadingView label="Ordenando tu ropero…" />
      ) : isError ? (
        <EmptyState icon="cloud-offline-outline" tone="danger" title="No pudimos cargar tus prendas" subtitle="Revisá tu conexión y volvé a intentar." actionLabel="Reintentar" onAction={() => refetch()} />
      ) : (
        <FlatList
          data={filtered}
          numColumns={2}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }: { item: Listing }) => <ListingCard listing={item} showStatus linkToEdit />}
          ListEmptyComponent={<EmptyState icon="shirt-outline" title={emptyCopy.title} subtitle={emptyCopy.subtitle} actionLabel="Publicar prenda" onAction={() => router.push('/listing/new')} />}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },
  eyebrow: { ...Typography.micro, color: Colors.primaryInk },
  title: { ...Typography.title, marginTop: Spacing.xs },
  summary: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg, padding: Spacing.lg, borderRadius: Radius.xl, backgroundColor: Colors.butterSoft, borderWidth: 1, borderColor: Colors.borderStrong },
  summaryIcon: { width: 42, height: 42, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  summaryBody: { flex: 1, gap: Spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.sm },
  summaryText: { ...Typography.label },
  summaryAvailable: { ...Typography.caption, fontWeight: '600' },
  meter: { height: 7, borderRadius: Radius.pill, backgroundColor: Colors.surface, overflow: 'hidden' },
  meterFill: { height: '100%', borderRadius: Radius.pill, backgroundColor: Colors.plum },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg },
  grid: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg, flexGrow: 1 },
  column: { gap: Spacing.lg },
});
