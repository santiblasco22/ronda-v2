import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Listing } from '@/types/models';
import { formatPrice } from '@/utils/format';

import { Avatar } from './Avatar';
import { ProBadge, StatusBadge } from './StatusBadge';

export function ListingCard({ listing, showStatus }: { listing: Listing; showStatus?: boolean }) {
  return (
    <Link href={{ pathname: '/listing/[id]', params: { id: listing.id } }} asChild>
      <Pressable style={styles.card}>
        <Image
          source={{ uri: listing.photos[0] }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSjE.AyE_3t7t7R**0o#DgR4' }}
        />
        {showStatus && listing.status !== 'active' ? (
          <View style={styles.statusOverlay}>
            <StatusBadge status={listing.status} />
          </View>
        ) : null}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <View style={styles.sellerRow}>
            <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={18} />
            <Text style={styles.sellerName} numberOfLines={1}>
              @{listing.sellerUsername}
            </Text>
            {listing.sellerIsPro ? <ProBadge /> : null}
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  statusOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  body: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  price: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  sellerName: {
    fontSize: 11,
    color: Colors.textMuted,
    flexShrink: 1,
  },
});
