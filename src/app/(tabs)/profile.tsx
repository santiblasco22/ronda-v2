import { Link, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { ProBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { getListingCapFor } from '@/constants/limits';
import { HitSlop, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { signOut } from '@/features/auth/authApi';
import { useMyListings } from '@/features/listings/useListings';
import { useLatestProRequest } from '@/features/pro/useProRequest';
import { useUserStats } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

const PREVIEW_LISTINGS = 4;

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings } = useMyListings();
  const { data: proRequest } = useLatestProRequest();
  const { data: stats } = useUserStats(profile?.uid);

  if (!profile) return null;

  const cap = getListingCapFor(profile.isPro);
  const activeListings = (listings ?? []).filter((l) => l.status === 'active');
  const preview = activeListings.slice(0, PREVIEW_LISTINGS);
  const remainingSlots = Math.max(cap - profile.activeListingCount, 0);
  const hasSocialLinks = Boolean(
    profile.socialLinks.instagram || profile.socialLinks.whatsapp || profile.socialLinks.facebook
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Perfil"
          action={
            <HeaderIconButton icon="log-out-outline" label="Cerrar sesión" onPress={() => signOut()} />
          }
        />

        <View style={styles.card}>
          <Avatar url={profile.avatarUrl} name={profile.displayName} size={84} />
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.isPro ? <ProBadge /> : null}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.city ? <Text style={styles.city}>📍 {profile.city}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <RatingStars value={stats?.ratingAvg ?? 0} count={stats?.ratingCount ?? 0} showValue size={18} />

          <View style={styles.statsRow}>
            <Link href={{ pathname: '/followers/[id]', params: { id: profile.uid } }} asChild>
              <Pressable
                style={styles.stat}
                hitSlop={HitSlop.small}
                accessibilityRole="button"
                accessibilityLabel={`Ver seguidores: ${formatCount(stats?.followers)}`}
              >
                <Text style={styles.statNumber}>{formatCount(stats?.followers)}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </Pressable>
            </Link>
            <View style={styles.statDivider} />
            <Link href={{ pathname: '/following/[id]', params: { id: profile.uid } }} asChild>
              <Pressable
                style={styles.stat}
                hitSlop={HitSlop.small}
                accessibilityRole="button"
                accessibilityLabel={`Ver a quién seguís: ${formatCount(stats?.following)}`}
              >
                <Text style={styles.statNumber}>{formatCount(stats?.following)}</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </Pressable>
            </Link>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {profile.activeListingCount}
                <Text style={styles.statNumberMuted}>/{cap}</Text>
              </Text>
              <Text style={styles.statLabel}>Publicadas</Text>
            </View>
          </View>

          {hasSocialLinks ? (
            <SocialLinksRow links={profile.socialLinks} />
          ) : (
            <Pressable
              onPress={() => router.push('/edit-profile')}
              accessibilityRole="button"
              style={styles.addLinksHint}
            >
              <Text style={styles.addLinksText}>
                Agregá tu Instagram o WhatsApp para que puedan contactarte
              </Text>
            </Pressable>
          )}

          <Button
            label="Publicar prenda"
            icon="add"
            onPress={() => router.push('/listing/new')}
            style={styles.primaryAction}
          />
          <View style={styles.secondaryActions}>
            <Button
              label="Editar perfil"
              variant="outline"
              small
              onPress={() => router.push('/edit-profile')}
              style={styles.secondaryButton}
            />
            <Button
              label="Mis publicaciones"
              variant="outline"
              small
              onPress={() => router.push('/my-listings')}
              style={styles.secondaryButton}
            />
          </View>

          {!profile.isPro ? (
            <Pressable
              style={({ pressed }) => [styles.proCard, pressed && styles.proCardPressed]}
              onPress={() => router.push('/pro-request')}
              disabled={proRequest?.status === 'pending'}
              accessibilityRole="button"
            >
              <Text style={styles.proTitle}>
                {proRequest?.status === 'pending'
                  ? 'Tu solicitud PRO está en revisión'
                  : 'Pasate a cuenta PRO'}
              </Text>
              <Text style={styles.proBody}>
                {proRequest?.status === 'pending'
                  ? 'Te avisamos por notificación cuando la revisemos.'
                  : `Hoy te quedan ${remainingSlots} de ${cap} publicaciones activas. Con PRO llegás a 50.`}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis publicaciones activas</Text>
          {activeListings.length > PREVIEW_LISTINGS ? (
            <Pressable
              onPress={() => router.push('/my-listings')}
              hitSlop={HitSlop.small}
              accessibilityRole="button"
            >
              <Text style={styles.sectionLink}>Ver todas</Text>
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={preview}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="shirt-outline"
              title="Todavía no publicaste nada"
              subtitle="Subí tu primera prenda: con el precio, el talle y el estado alcanza para que aparezca en Descubrir."
              actionLabel="Publicar prenda"
              onAction={() => router.push('/listing/new')}
            />
          }
        />
      </ScrollView>
    </Screen>
  );
}

/** Mientras la agregación viaja mostramos un guion en vez de un cero falso. */
function formatCount(value: number | undefined): string {
  return value === undefined ? '—' : String(value);
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: Spacing.xxxl,
  },
  card: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
    ...Shadows.card,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  displayName: {
    ...Typography.heading,
    fontSize: 20,
  },
  username: {
    ...Typography.caption,
  },
  city: {
    ...Typography.caption,
  },
  bio: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    justifyContent: 'space-around',
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  stat: {
    alignItems: 'center',
    minWidth: 74,
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 26,
    backgroundColor: Colors.border,
  },
  statNumber: {
    ...Typography.bodyStrong,
    fontSize: 17,
    fontWeight: '800',
  },
  statNumberMuted: {
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statLabel: {
    ...Typography.micro,
  },
  addLinksHint: {
    marginTop: Spacing.xs,
  },
  addLinksText: {
    ...Typography.caption,
    color: Colors.primaryInk,
    textAlign: 'center',
    fontWeight: '600',
  },
  primaryAction: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
  },
  secondaryActions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1,
  },
  proCard: {
    alignSelf: 'stretch',
    marginTop: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
    gap: Spacing.xs,
  },
  proCardPressed: {
    opacity: 0.85,
  },
  proTitle: {
    ...Typography.sectionTitle,
  },
  proBody: {
    ...Typography.caption,
    color: Colors.text,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
  },
  sectionLink: {
    ...Typography.micro,
    color: Colors.primaryInk,
    fontWeight: '700',
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  column: {
    gap: Spacing.lg,
  },
});
