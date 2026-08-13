import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FollowButton } from '@/components/FollowButton';
import { ListingCard } from '@/components/ListingCard';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { ProBadge } from '@/components/StatusBadge';
import { Colors } from '@/constants/colors';
import { HitSlop, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useUserListings } from '@/features/listings/useListings';
import { useRatingsForUser } from '@/features/ratings/useRatings';
import { useUserProfile, useUserStats } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeDate } from '@/utils/format';

const PREVIEW_RATINGS = 3;

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: profile, isLoading } = useUserProfile(id);
  const { data: listings } = useUserListings(id);
  const { data: stats } = useUserStats(id);
  const { data: ratings } = useRatingsForUser(id);

  if (isLoading) return <LoadingView />;
  if (!profile) {
    return (
      <Screen>
        <EmptyState
          icon="person-outline"
          title="No encontramos este perfil"
          subtitle="Puede que la cuenta ya no exista."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const isMe = myUid === profile.uid;
  const activeListings = (listings ?? []).filter((l) => l.status === 'active');
  const recentRatings = (ratings ?? []).slice(0, PREVIEW_RATINGS);
  const hasSocialLinks = Boolean(
    profile.socialLinks.instagram || profile.socialLinks.whatsapp || profile.socialLinks.facebook
  );

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
                accessibilityLabel={`Ver a quién sigue: ${formatCount(stats?.following)}`}
              >
                <Text style={styles.statNumber}>{formatCount(stats?.following)}</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </Pressable>
            </Link>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatCount(stats?.activeListings)}</Text>
              <Text style={styles.statLabel}>Publicadas</Text>
            </View>
          </View>

          {hasSocialLinks ? <SocialLinksRow links={profile.socialLinks} /> : null}

          {!isMe ? (
            <View style={styles.actionsRow}>
              <FollowButton target={profile} style={styles.actionButton} />
              <Button
                label="Calificar"
                variant="outline"
                icon="star-outline"
                style={styles.actionButton}
                onPress={() =>
                  router.push({
                    pathname: '/rate/[userId]',
                    params: { userId: profile.uid, listingId: '', listingTitle: '' },
                  })
                }
              />
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Publicaciones activas</Text>
        <FlatList
          data={activeListings}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          columnWrapperStyle={styles.column}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => <ListingCard listing={item} />}
          ListEmptyComponent={
            <EmptyState
              icon="shirt-outline"
              title="Sin publicaciones activas"
              subtitle={`Cuando ${profile.displayName} publique algo nuevo lo vas a ver acá. Seguilo para enterarte.`}
            />
          }
        />

        {recentRatings.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Opiniones {stats?.ratingCount ? `(${stats.ratingCount})` : ''}
            </Text>
            <View style={styles.ratingsList}>
              {recentRatings.map((rating) => (
                <View key={rating.id} style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <Avatar url={rating.raterAvatarUrl} name={rating.raterDisplayName} size={28} />
                    <Text style={styles.ratingAuthor} numberOfLines={1}>
                      {rating.raterDisplayName}
                    </Text>
                    <RatingStars value={rating.stars} size={13} />
                  </View>
                  {rating.comment ? <Text style={styles.ratingComment}>{rating.comment}</Text> : null}
                  <Text style={styles.ratingDate}>{formatRelativeDate(rating.createdAt)}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
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
    paddingTop: Spacing.lg,
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
  statLabel: {
    ...Typography.micro,
  },
  actionsRow: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontSize: 16,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  grid: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },
  column: {
    gap: Spacing.lg,
  },
  ratingsList: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingAuthor: {
    ...Typography.bodyStrong,
    fontSize: 14,
    flex: 1,
  },
  ratingComment: {
    ...Typography.caption,
    color: Colors.text,
  },
  ratingDate: {
    ...Typography.micro,
  },
});
