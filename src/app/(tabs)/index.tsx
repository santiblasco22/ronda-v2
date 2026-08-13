import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { InlineNotice } from '@/components/FormSection';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { useDiscoveryQueue, useRecordInteraction } from '@/features/discovery/useDiscovery';
import type { Listing } from '@/types/models';

export default function DiscoverScreen() {
  const router = useRouter();
  const { data: listings, isLoading, isError, refetch } = useDiscoveryQueue();
  const recordInteraction = useRecordInteraction();
  const [deckEpoch, setDeckEpoch] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  async function handleLike(listing: Listing) {
    await recordInteraction.mutateAsync({ listing, action: 'like' });
  }
  async function handlePass(listing: Listing) {
    await recordInteraction.mutateAsync({ listing, action: 'pass' });
  }
  function handleOpen(listing: Listing) {
    router.push({ pathname: '/listing/[id]', params: { id: listing.id } });
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const result = await refetch();
      if (!result.error) {
        // Remonta el mazo con el snapshot fresco del servidor (y limpia committed).
        setDeckEpoch((epoch) => epoch + 1);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen padded={false}>
      <ScreenHeader title="Descubrí" subtitle="Prendas únicas, una por una, sin apuro" />
      {recordInteraction.isError ? (
        <View style={styles.errorBanner}>
          <InlineNotice message="No pudimos guardar tu último swipe. La prenda volvió al mazo para que puedas intentar de nuevo." />
        </View>
      ) : null}
      <ScrollView
        style={styles.deckArea}
        contentContainerStyle={styles.deckAreaContent}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={Colors.primaryInk}
          />
        }
      >
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
          <View style={styles.deckWrap}>
            <SwipeDeck
              key={deckEpoch}
              listings={listings}
              onLike={handleLike}
              onPass={handlePass}
              onOpenListing={handleOpen}
              isCommitting={recordInteraction.isPending}
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  deckArea: {
    flex: 1,
  },
  deckAreaContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  deckWrap: {
    flex: 1,
  },
  errorBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
