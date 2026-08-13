import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useDiscoveryQueue, useRecordInteraction } from '@/features/discovery/useDiscovery';
import type { Listing } from '@/types/models';

export default function DiscoverScreen() {
  const router = useRouter();
  const { data: listings, isLoading, isError, refetch } = useDiscoveryQueue();
  const recordInteraction = useRecordInteraction();

  function handleLike(listing: Listing) {
    recordInteraction.mutate({ listing, action: 'like' });
  }
  function handlePass(listing: Listing) {
    recordInteraction.mutate({ listing, action: 'pass' });
  }
  function handleOpen(listing: Listing) {
    router.push({ pathname: '/listing/[id]', params: { id: listing.id } });
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Descubrir" subtitle="Deslizá para guardar lo que te gusta" />
      {recordInteraction.isError ? (
        <Text style={styles.errorBanner}>
          No pudimos guardar tu último swipe. Revisá tu conexión: al recargar puede volver a
          aparecer esa prenda.
        </Text>
      ) : null}
      <View style={styles.deckArea}>
        {isLoading ? (
          <LoadingView label="Buscando prendas…" />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="danger"
            title="No pudimos cargar publicaciones"
            subtitle="Revisá tu conexión y volvé a intentar."
            actionLabel="Reintentar"
            onAction={() => refetch()}
          />
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="¡Ya viste todo por ahora!"
            subtitle="Volvé más tarde para descubrir prendas nuevas, o buscá por categoría y talle mientras tanto."
            actionLabel="Ir a Buscar"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <SwipeDeck
            listings={listings}
            onLike={handleLike}
            onPass={handlePass}
            onOpenListing={handleOpen}
            isCommitting={recordInteraction.isPending}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  deckArea: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  errorBanner: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
});
