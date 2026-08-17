import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { DiscoveryReel } from '@/components/DiscoveryReel';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { InlineNotice } from '@/components/FormSection';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Spacing, Typography } from '@/constants/theme';
import { useDiscoveryQueue, useRecordInteraction } from '@/features/discovery/useDiscovery';
import type { Listing } from '@/types/models';

export default function DiscoverScreen() {
  const router = useRouter();
  const { data: listings, isLoading, isError, refetch } = useDiscoveryQueue();
  const recordInteraction = useRecordInteraction();
  const [reelEpoch, setReelEpoch] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const hasReel = !isLoading && !isError && Boolean(listings?.length);

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
        // Un refresh explícito inicia una nueva sesión local con el snapshot
        // fresco. Las interacciones normales nunca invalidan esta cola.
        setReelEpoch((epoch) => epoch + 1);
      }
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen padded={false}>
      <View style={styles.content}>
        {isLoading ? (
          <LoadingView label="Buscando prendas…" />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            tone="danger"
            title="No pudimos cargar publicaciones"
            subtitle="Revisá tu conexión y volvé a intentar."
            actionLabel="Reintentar"
            onAction={() => void handleRefresh()}
          />
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="¡Ya viste todo por ahora!"
            subtitle="Actualizá para buscar prendas nuevas, o explorá por categoría y talle."
            actionLabel="Ir a Buscar"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <DiscoveryReel
            key={reelEpoch}
            listings={listings}
            onLike={handleLike}
            onPass={handlePass}
            onOpenListing={handleOpen}
            isCommitting={recordInteraction.isPending}
          />
        )}

        <View pointerEvents="box-none" style={styles.topBar}>
          {!hasReel ? <Text style={styles.screenLabel}>RONDA · DESCUBRIR</Text> : <View />}
          <Pressable
            onPress={() => void handleRefresh()}
            disabled={refreshing || recordInteraction.isPending}
            accessibilityRole="button"
            accessibilityLabel="Actualizar publicaciones"
            accessibilityState={{ disabled: refreshing || recordInteraction.isPending }}
            hitSlop={Spacing.sm}
            style={({ pressed }) => [
              styles.refreshButton,
              hasReel && styles.refreshButtonOverlay,
              pressed && styles.refreshButtonPressed,
              (refreshing || recordInteraction.isPending) && styles.refreshButtonDisabled,
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={hasReel ? Colors.white : Colors.primaryInk} />
            ) : (
              <Ionicons
                name="refresh"
                size={20}
                color={hasReel ? Colors.white : Colors.primaryInk}
              />
            )}
          </Pressable>
        </View>

        {recordInteraction.isError ? (
          <View style={styles.errorBanner}>
            <InlineNotice message="No pudimos guardar la interacción. Restauramos la prenda para que puedas intentar de nuevo." />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  screenLabel: {
    ...Typography.micro,
    color: Colors.primaryInk,
  },
  refreshButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  refreshButtonOverlay: {
    backgroundColor: 'rgba(35,18,31,0.65)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  refreshButtonPressed: {
    transform: [{ scale: 0.92 }],
  },
  refreshButtonDisabled: {
    opacity: 0.55,
  },
  errorBanner: {
    position: 'absolute',
    zIndex: 5,
    top: 64,
    left: Spacing.md,
    right: Spacing.md,
  },
});
