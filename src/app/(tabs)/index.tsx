import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { EmptyState, LoadingView } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SwipeDeck } from '@/components/SwipeDeck';
import { Colors } from '@/constants/colors';
import { useDiscoveryQueue, useRecordInteraction } from '@/features/discovery/useDiscovery';
import type { Listing } from '@/types/models';

export default function DiscoverScreen() {
  const router = useRouter();
  const { data: listings, isLoading, isError } = useDiscoveryQueue();
  const { mutate: recordInteraction } = useRecordInteraction();

  function handleLike(listing: Listing) {
    recordInteraction({ listing, action: 'like' });
  }
  function handlePass(listing: Listing) {
    recordInteraction({ listing, action: 'pass' });
  }
  function handleOpen(listing: Listing) {
    router.push({ pathname: '/listing/[id]', params: { id: listing.id } });
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Descubrir</Text>
      </View>
      <View style={styles.deckArea}>
        {isLoading ? (
          <LoadingView />
        ) : isError ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="No pudimos cargar publicaciones"
            subtitle="Revisá tu conexión y volvé a intentar."
          />
        ) : !listings || listings.length === 0 ? (
          <EmptyState
            icon="checkmark-done-outline"
            title="¡Ya viste todo por ahora!"
            subtitle="Volvé más tarde para descubrir nuevas prendas."
          />
        ) : (
          <SwipeDeck
            listings={listings}
            onLike={handleLike}
            onPass={handlePass}
            onOpenListing={handleOpen}
          />
        )}
      </View>
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
  deckArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
