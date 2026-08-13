import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { Listing } from '@/types/models';
import { formatPrice } from '@/utils/format';

import { Avatar } from './Avatar';
import { ProBadge } from './StatusBadge';
import { SwipeCard, type SwipeCardRef } from './SwipeCard';

const VISIBLE_STACK = 3;

export function SwipeDeck({
  listings,
  onLike,
  onPass,
  onOpenListing,
}: {
  listings: Listing[];
  onLike: (listing: Listing) => void;
  onPass: (listing: Listing) => void;
  onOpenListing: (listing: Listing) => void;
}) {
  const [index, setIndex] = useState(0);
  const topCardRef = useRef<SwipeCardRef>(null);
  const current = listings[index];
  const visible = listings.slice(index, index + VISIBLE_STACK);

  function advance() {
    setIndex((i) => i + 1);
  }

  return (
    <View style={styles.container}>
      {visible.length === 0 ? null : (
        <View style={styles.stack}>
          {visible
            .map((listing, i) => ({ listing, i }))
            .reverse()
            .map(({ listing, i }) => (
              <SwipeCard
                key={listing.id}
                ref={i === 0 ? topCardRef : undefined}
                isTop={i === 0}
                disabled={i !== 0}
                onSwipeRight={() => {
                  onLike(listing);
                  advance();
                }}
                onSwipeLeft={() => {
                  onPass(listing);
                  advance();
                }}
              >
                <ListingCardFace listing={listing} onPress={() => i === 0 && onOpenListing(listing)} />
              </SwipeCard>
            ))}
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.actionButton, styles.passButton]}
          onPress={() => current && topCardRef.current?.swipeLeft()}
        >
          <Ionicons name="close" size={28} color={Colors.pass} />
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.likeButton]}
          onPress={() => current && topCardRef.current?.swipeRight()}
        >
          <Ionicons name="heart" size={26} color={Colors.white} />
        </Pressable>
      </View>
    </View>
  );
}

function ListingCardFace({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <Pressable style={styles.face} onPress={onPress}>
      <Image source={{ uri: listing.photos[0] }} style={styles.image} contentFit="cover" />
      <View style={styles.gradientFooter}>
        <View style={styles.sellerRow}>
          <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={28} />
          <Text style={styles.sellerName}>@{listing.sellerUsername}</Text>
          {listing.sellerIsPro ? <ProBadge /> : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <Text style={styles.meta}>
            {listing.size} · {listing.condition}
          </Text>
        </View>
        {listing.city ? <Text style={styles.city}>📍 {listing.city}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  stack: {
    flex: 1,
    width: '100%',
    marginBottom: 12,
  },
  face: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  image: {
    flex: 1,
    backgroundColor: Colors.border,
  },
  gradientFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlay,
    padding: 16,
    gap: 4,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sellerName: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 19,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 2,
  },
  price: {
    color: Colors.primarySoft,
    fontWeight: '800',
    fontSize: 17,
  },
  meta: {
    color: Colors.white,
    fontSize: 13,
    opacity: 0.9,
  },
  city: {
    color: Colors.white,
    fontSize: 12,
    opacity: 0.85,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 8,
  },
  actionButton: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: Colors.black,
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  passButton: {
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.pass,
  },
  likeButton: {
    backgroundColor: Colors.like,
  },
});
