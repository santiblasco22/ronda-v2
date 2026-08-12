import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
import { FollowButton } from '@/components/FollowButton';
import { Screen } from '@/components/Screen';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { ProBadge, StatusBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { useListing } from '@/features/listings/useListings';
import { useUserProfile } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatRelativeDate } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: listing, isLoading } = useListing(id);
  const { data: seller } = useUserProfile(listing?.sellerId);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (isLoading || !listing) return <LoadingView />;

  const isOwner = myUid === listing.sellerId;

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: listing.title }} />
      <ScrollView>
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
            }
          >
            {listing.photos.map((photo, index) => (
              <Image key={index} source={{ uri: photo }} style={styles.photo} contentFit="cover" />
            ))}
          </ScrollView>
          {listing.photos.length > 1 ? (
            <View style={styles.dotsRow}>
              {listing.photos.map((_, index) => (
                <View key={index} style={[styles.dot, index === photoIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <StatusBadge status={listing.status} />
          </View>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>

          <View style={styles.tagsRow}>
            <Tag label={listing.category} />
            <Tag label={listing.size} />
            <Tag label={listing.condition} />
            {listing.color ? <Tag label={listing.color} /> : null}
          </View>

          {listing.city ? <Text style={styles.city}>📍 {listing.city}</Text> : null}
          <Text style={styles.date}>Publicado {formatRelativeDate(listing.createdAt)}</Text>

          {listing.description ? <Text style={styles.description}>{listing.description}</Text> : null}

          <View style={styles.sellerCard}>
            <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={48} />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName}>{listing.sellerDisplayName}</Text>
                {listing.sellerIsPro ? <ProBadge /> : null}
              </View>
              <Text style={styles.sellerUsername}>@{listing.sellerUsername}</Text>
            </View>
            {!isOwner ? (
              <View style={styles.sellerButtons}>
                {seller ? <FollowButton target={seller} small /> : null}
                <Button
                  label="Ver perfil"
                  variant="ghost"
                  small
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: listing.sellerId } })}
                />
              </View>
            ) : null}
          </View>

          {!isOwner ? (
            <View style={styles.contactSection}>
              <Text style={styles.contactTitle}>Contactar al vendedor</Text>
              {seller && (seller.socialLinks.instagram || seller.socialLinks.whatsapp || seller.socialLinks.facebook) ? (
                <SocialLinksRow links={seller.socialLinks} contactContext={listing.title} size={24} />
              ) : (
                <Text style={styles.noContact}>Este vendedor no cargó redes de contacto todavía.</Text>
              )}
              <Button
                label="Calificar vendedor"
                variant="outline"
                small
                style={styles.rateButton}
                onPress={() =>
                  router.push({
                    pathname: '/rate/[userId]',
                    params: { userId: listing.sellerId, listingId: listing.id, listingTitle: listing.title },
                  })
                }
              />
            </View>
          ) : (
            <View style={styles.contactSection}>
              <Button
                label="Editar publicación"
                variant="outline"
                onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: listing.id } })}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Ionicons name="pricetag-outline" size={12} color={Colors.textMuted} />
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH,
    backgroundColor: Colors.border,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 8,
    height: 8,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
    flex: 1,
  },
  price: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  city: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 6,
  },
  date: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  description: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginTop: 8,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  sellerUsername: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  sellerButtons: {
    alignItems: 'flex-end',
    gap: 6,
  },
  contactSection: {
    marginTop: 20,
    gap: 12,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  noContact: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  rateButton: {
    alignSelf: 'flex-start',
  },
});
