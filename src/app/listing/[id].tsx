import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FollowButton } from '@/components/FollowButton';
import { InlineNotice } from '@/components/FormSection';
import { ListingPhoto } from '@/components/ListingPhoto';
import { Screen } from '@/components/Screen';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { ProBadge, StatusBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useListing } from '@/features/listings/useListings';
import { useUserProfile } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import { formatPrice, formatRelativeDate } from '@/utils/format';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: listing, isLoading, isError, refetch } = useListing(id);
  const { data: seller, isError: sellerError, refetch: refetchSeller } = useUserProfile(listing?.sellerId);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (isLoading) return <LoadingView />;
  if (isError) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="No pudimos abrir esta prenda"
          subtitle="Revisá tu conexión y volvé a intentar."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }
  if (!listing) {
    return (
      <Screen>
        <EmptyState
          icon="help-circle-outline"
          title="No encontramos esta publicación"
          subtitle="Puede que el vendedor la haya eliminado."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const isOwner = myUid === listing.sellerId;
  const hasContactLinks = Boolean(
    seller?.socialLinks.instagram || seller?.socialLinks.whatsapp || seller?.socialLinks.facebook
  );

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: listing.title }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View>
          {listing.photos.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setPhotoIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH))
              }
            >
              {listing.photos.map((photo, index) => (
                <ListingPhoto key={index} uri={photo} style={styles.photo} />
              ))}
            </ScrollView>
          ) : (
            <ListingPhoto
              style={styles.photo}
              iconSize={64}
              label="Esta publicación no tiene fotos"
            />
          )}
          {listing.photos.length > 1 ? (
            <View style={styles.dotsRow}>
              {listing.photos.map((_, index) => (
                <View key={index} style={[styles.dot, index === photoIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.content}>
          <Text style={styles.eyebrow}>HALLAZGO EN RONDA</Text>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{listing.title}</Text>
            <StatusBadge status={listing.status} />
          </View>
          <Text style={styles.price}>{formatPrice(listing.price)}</Text>

          <View style={styles.tagsRow}>
            <Tag icon="pricetag-outline" label={listing.category} />
            <Tag icon="resize-outline" label={`Talle ${listing.size}`} />
            <Tag icon="sparkles-outline" label={listing.condition} />
            {listing.color ? <Tag icon="color-palette-outline" label={listing.color} /> : null}
          </View>

          <View style={styles.metaRow}>
            {listing.city ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.meta}>{listing.city}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.meta}>Publicado {formatRelativeDate(listing.createdAt)}</Text>
            </View>
            {listing.likeCount > 0 ? (
              <View style={styles.metaItem}>
                <Ionicons name="heart" size={14} color={Colors.like} />
                <Text style={styles.meta}>
                  {listing.likeCount} {listing.likeCount === 1 ? 'me gusta' : 'me gusta'}
                </Text>
              </View>
            ) : null}
          </View>

          {listing.description ? (
            <Text style={styles.description}>{listing.description}</Text>
          ) : null}

          <View style={styles.sellerCard}>
            <Avatar url={listing.sellerAvatarUrl} name={listing.sellerDisplayName} size={48} />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={styles.sellerName} numberOfLines={1}>
                  {listing.sellerDisplayName}
                </Text>
                {listing.sellerIsPro ? <ProBadge /> : null}
              </View>
              <Text style={styles.sellerUsername}>@{listing.sellerUsername}</Text>
            </View>
            {!isOwner && seller ? <FollowButton target={seller} small /> : null}
          </View>

          {!isOwner ? (
            <View style={styles.section}>
              <View style={styles.sectionTitleRow}>
                <View style={styles.sectionIcon}>
                  <Ionicons name="paper-plane-outline" size={18} color={Colors.plum} />
                </View>
                <View style={styles.sectionTitleText}>
                  <Text style={styles.sectionEyebrow}>COORDINÁ POR FUERA</Text>
                  <Text style={styles.sectionTitle}>Contactá al vendedor</Text>
                </View>
              </View>
              {sellerError ? (
                <>
                  <InlineNotice message="No pudimos cargar las vías de contacto. Revisá tu conexión y volvé a intentar." />
                  <Button label="Reintentar contacto" variant="outline" small onPress={() => refetchSeller()} />
                </>
              ) : hasContactLinks && seller ? (
                <>
                  <Text style={styles.sectionHint}>
                    Elegí su red preferida para consultar y acordar la entrega. Ronda no procesa pagos.
                  </Text>
                  <SocialLinksRow links={seller.socialLinks} contactContext={listing.title} size={22} />
                </>
              ) : (
                <Text style={styles.sectionHint}>
                  Este vendedor todavía no cargó redes de contacto. Podés seguirlo para enterarte
                  cuando las agregue.
                </Text>
              )}
              <View style={styles.sellerActions}>
                <Button
                  label="Ver perfil"
                  variant="outline"
                  small
                  onPress={() => router.push({ pathname: '/user/[id]', params: { id: listing.sellerId } })}
                />
                <Button
                  label="Calificar vendedor"
                  variant="ghost"
                  small
                  icon="star-outline"
                  onPress={() =>
                    router.push({
                      pathname: '/rate/[userId]',
                      params: { userId: listing.sellerId, listingId: listing.id, listingTitle: listing.title },
                    })
                  }
                />
              </View>
            </View>
          ) : (
            <View style={styles.section}>
              <Button
                label="Editar publicación"
                variant="outline"
                icon="create-outline"
                onPress={() => router.push({ pathname: '/listing/edit/[id]', params: { id: listing.id } })}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

function Tag({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.tag}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.tagLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.08,
  },
  dotsRow: {
    position: 'absolute',
    bottom: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.xs + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 9,
    height: 9,
  },
  content: {
    padding: Spacing.xl,
    gap: Spacing.sm,
    marginTop: -Spacing.xxl,
    borderTopLeftRadius: Radius.xxl,
    borderTopRightRadius: Radius.xxl,
    backgroundColor: Colors.background,
  },
  eyebrow: { ...Typography.micro, color: Colors.primaryInk, marginTop: Spacing.sm },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.heading,
    fontSize: 21,
    flex: 1,
  },
  price: {
    ...Typography.display,
    fontSize: 25,
    color: Colors.plum,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
  },
  tagLabel: {
    ...Typography.micro,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginTop: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  meta: {
    ...Typography.caption,
  },
  description: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.card,
  },
  sellerInfo: {
    flex: 1,
    gap: 2,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sellerName: {
    ...Typography.bodyStrong,
    flexShrink: 1,
  },
  sellerUsername: {
    ...Typography.micro,
  },
  section: {
    marginTop: Spacing.xl,
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.butterSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: { flex: 1 },
  sectionEyebrow: { ...Typography.micro, color: Colors.primaryInk },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
  },
  sectionHint: {
    ...Typography.caption,
  },
  sellerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
});
