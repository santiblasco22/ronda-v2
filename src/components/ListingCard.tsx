import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Listing } from '@/types/models';
import { formatPrice } from '@/utils/format';

import { Avatar } from './Avatar';
import { ListingPhoto } from './ListingPhoto';
import { ProBadge, StatusBadge } from './StatusBadge';

export function ListingCard({
  listing,
  showStatus,
  variant = 'grid',
  linkToEdit = false,
}: {
  listing: Listing;
  showStatus?: boolean;
  variant?: 'grid' | 'feed';
  linkToEdit?: boolean;
}) {
  const accessibilityLabel = [
    listing.title,
    formatPrice(listing.price),
    `talle ${listing.size}`,
    `de @${listing.sellerUsername}`,
  ].join(', ');

  return (
    <Link
      href={
        linkToEdit
          ? { pathname: '/listing/edit/[id]', params: { id: listing.id } }
          : { pathname: '/listing/[id]', params: { id: listing.id } }
      }
      asChild
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${linkToEdit ? 'Editar, ' : ''}${accessibilityLabel}`}
        style={({ pressed }) => [styles.card, variant === 'feed' && styles.feedCard, pressed && styles.cardPressed]}
      >
        <ListingPhoto uri={listing.photos[0]} style={[styles.image, variant === 'feed' && styles.feedImage]} />
        {showStatus && listing.status !== 'active' ? (
          <View style={styles.statusOverlay}>
            <StatusBadge status={listing.status} />
          </View>
        ) : null}
        {listing.likeCount > 0 ? (
          <View style={styles.likePill}>
            <Ionicons name="heart" size={11} color={Colors.white} />
            <Text style={styles.likeCount}>{listing.likeCount}</Text>
          </View>
        ) : null}
        <View style={[styles.body, variant === 'feed' && styles.feedBody]}>
          <Text style={styles.title} numberOfLines={1}>
            {listing.title}
          </Text>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            Talle {listing.size} · {listing.condition}
          </Text>
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
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  cardPressed: {
    borderColor: Colors.primary,
    transform: [{ scale: 0.985 }],
  },
  image: {
    width: '100%',
    aspectRatio: 0.84,
  },
  feedCard: { width: '100%' },
  feedImage: { aspectRatio: 1.05 },
  feedBody: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },
  statusOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  likePill: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: Colors.overlayStrong,
  },
  likeCount: {
    ...Typography.micro,
    color: Colors.white,
    fontWeight: '700',
  },
  body: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: 4,
  },
  title: {
    ...Typography.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
  },
  price: {
    ...Typography.heading,
    fontSize: 16,
    lineHeight: 21,
    color: Colors.plum,
  },
  meta: {
    ...Typography.micro,
    fontWeight: '500',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    marginTop: Spacing.sm,
  },
  sellerName: {
    ...Typography.micro,
    flexShrink: 1,
  },
});
