import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { Listing } from '@/types/models';
import { formatPrice } from '@/utils/format';

import { Avatar } from './Avatar';
import { ListingPhoto } from './ListingPhoto';
import { ProBadge } from './StatusBadge';
import { SwipeCard, type SwipeCardRef } from './SwipeCard';

const VISIBLE_STACK = 3;

export function SwipeDeck({
  listings,
  onLike,
  onPass,
  onOpenListing,
  isCommitting,
}: {
  listings: Listing[];
  onLike: (listing: Listing) => void;
  onPass: (listing: Listing) => void;
  onOpenListing: (listing: Listing) => void;
  /** Hay un swipe viajando al servidor: los botones se apagan hasta que vuelva. */
  isCommitting?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const topCardRef = useRef<SwipeCardRef>(null);
  // Red de seguridad final: aunque el gesto y el botón resuelvan la misma
  // carta, cada publicación se registra una única vez. Un doble registro
  // rompería el write (la interacción es inmutable) y descontaría una carta
  // sin haberla mostrado.
  const committed = useRef(new Set<string>());
  const current = listings[index];
  const visible = listings.slice(index, index + VISIBLE_STACK);
  const remaining = Math.max(listings.length - index, 0);
  const actionsDisabled = !current || Boolean(isCommitting);

  function commit(listing: Listing, action: 'like' | 'pass') {
    if (committed.current.has(listing.id)) return;
    committed.current.add(listing.id);
    if (action === 'like') onLike(listing);
    else onPass(listing);
    setIndex((i) => i + 1);
  }

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {visible
          .map((listing, i) => ({ listing, i }))
          .reverse()
          .map(({ listing, i }) => (
            <SwipeCard
              key={listing.id}
              ref={i === 0 ? topCardRef : undefined}
              isTop={i === 0}
              depth={i}
              disabled={i !== 0}
              onSwipeRight={() => commit(listing, 'like')}
              onSwipeLeft={() => commit(listing, 'pass')}
            >
              <ListingCardFace listing={listing} onPress={() => i === 0 && onOpenListing(listing)} />
            </SwipeCard>
          ))}
      </View>

      <View style={styles.footer}>
        <View style={styles.actions}>
          <DeckButton
            icon="close"
            label="Pasar esta prenda"
            color={Colors.pass}
            disabled={actionsDisabled}
            onPress={() => topCardRef.current?.swipeLeft()}
          />
          <DeckButton
            icon="heart"
            label="Me gusta esta prenda"
            color={Colors.white}
            background={Colors.like}
            disabled={actionsDisabled}
            onPress={() => topCardRef.current?.swipeRight()}
          />
        </View>
        <Text style={styles.hint}>
          {remaining > 0
            ? `Deslizá o usá los botones · quedan ${remaining} ${remaining === 1 ? 'prenda' : 'prendas'}`
            : 'No quedan prendas por ver'}
        </Text>
      </View>
    </View>
  );
}

function DeckButton({
  icon,
  label,
  color,
  background,
  disabled,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  background?: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [
        styles.actionButton,
        background ? { backgroundColor: background } : styles.actionButtonOutlined,
        !background && { borderColor: color },
        pressed && !disabled && styles.actionButtonPressed,
        disabled && styles.actionButtonDisabled,
      ]}
    >
      <Ionicons name={icon} size={28} color={color} />
    </Pressable>
  );
}

function ListingCardFace({ listing, onPress }: { listing: Listing; onPress: () => void }) {
  return (
    <Pressable
      style={styles.face}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver ${listing.title}, ${formatPrice(listing.price)}, de @${listing.sellerUsername}`}
    >
      <ListingPhoto
        uri={listing.photos[0]}
        style={styles.image}
        iconSize={56}
        label="Esta prenda todavía no tiene foto"
      />
      <View style={styles.scrim}>
        <View style={styles.sellerRow}>
          <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={26} />
          <Text style={styles.sellerName}>@{listing.sellerUsername}</Text>
          {listing.sellerIsPro ? <ProBadge /> : null}
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {listing.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>Talle {listing.size}</Text>
          </View>
          <View style={styles.metaPill}>
            <Text style={styles.metaPillText}>{listing.condition}</Text>
          </View>
        </View>
        {listing.city ? (
          <View style={styles.cityRow}>
            <Ionicons name="location-outline" size={13} color={Colors.white} />
            <Text style={styles.city}>{listing.city}</Text>
          </View>
        ) : null}
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
    marginBottom: Spacing.lg,
  },
  face: {
    flex: 1,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  image: {
    flex: 1,
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.overlayStrong,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sellerName: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  title: {
    color: Colors.white,
    fontWeight: '800',
    fontSize: 20,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  price: {
    color: Colors.primarySoft,
    fontWeight: '800',
    fontSize: 18,
  },
  metaPill: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  metaPillText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  city: {
    color: Colors.white,
    fontSize: 12,
    opacity: 0.9,
  },
  footer: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xxl,
  },
  actionButton: {
    width: 64,
    height: 64,
    minWidth: MIN_TOUCH_TARGET,
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.floating,
  },
  actionButtonOutlined: {
    backgroundColor: Colors.surface,
    borderWidth: 2,
  },
  actionButtonPressed: {
    transform: [{ scale: 0.94 }],
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  hint: {
    ...Typography.micro,
    textAlign: 'center',
  },
});
