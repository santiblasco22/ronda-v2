import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FollowButton } from '@/components/FollowButton';
import { ListingCard } from '@/components/ListingCard';
import { ProfileHero } from '@/components/ProfileHero';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
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
  const { data: profile, isLoading, isError, refetch } = useUserProfile(id);
  const { data: listings, isError: listingsError, refetch: refetchListings } = useUserListings(id);
  const { data: stats } = useUserStats(id);
  const { data: ratings } = useRatingsForUser(id);

  if (isLoading) return <LoadingView label="Abriendo el ropero…" />;
  if (isError) {
    return (
      <Screen>
        <EmptyState
          icon="cloud-offline-outline"
          tone="danger"
          title="No pudimos abrir este perfil"
          subtitle="Revisá tu conexión y volvé a intentar."
          actionLabel="Reintentar"
          onAction={() => refetch()}
        />
      </Screen>
    );
  }
  if (!profile) {
    return (
      <Screen>
        <EmptyState icon="person-outline" title="Este perfil ya no está en ronda" subtitle="Puede que la cuenta ya no exista." actionLabel="Volver" onAction={() => router.back()} />
      </Screen>
    );
  }

  const isMe = myUid === profile.uid;
  const activeListings = (listings ?? []).filter((listing) => listing.status === 'active');
  const recentRatings = (ratings ?? []).slice(0, PREVIEW_RATINGS);

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHero profile={profile} stats={stats} listingValue={String(stats?.activeListings ?? '—')}>
          {!isMe ? (
            <View style={styles.actionsRow}>
              <FollowButton target={profile} style={styles.actionButton} />
              <Button
                label="Calificar"
                variant="outline"
                icon="star-outline"
                style={styles.actionButton}
                onPress={() => router.push({ pathname: '/rate/[userId]', params: { userId: profile.uid } })}
              />
            </View>
          ) : null}
        </ProfileHero>

        <SectionHeading eyebrow="SU VIDRIERA" title="Prendas en ronda" />
        {listingsError ? (
          <EmptyState icon="cloud-offline-outline" tone="danger" title="No pudimos abrir esta vidriera" subtitle="El perfil cargó bien, pero faltan las prendas." actionLabel="Reintentar" onAction={() => refetchListings()} />
        ) : (
          <FlatList
            data={activeListings}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.column}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => <ListingCard listing={item} />}
            ListEmptyComponent={<EmptyState icon="shirt-outline" title="Este ropero está entre tandas" subtitle={`Cuando ${profile.displayName} publique algo nuevo, va a aparecer acá.`} />}
          />
        )}

        {recentRatings.length > 0 ? (
          <>
            <SectionHeading eyebrow="COMUNIDAD" title={`Opiniones${stats?.ratingCount ? ` · ${stats.ratingCount}` : ''}`} />
            <View style={styles.ratingsList}>
              {recentRatings.map((rating) => (
                <View key={rating.id} style={styles.ratingCard}>
                  <View style={styles.ratingHeader}>
                    <Avatar url={rating.raterAvatarUrl} name={rating.raterDisplayName} size={34} />
                    <View style={styles.ratingAuthorBlock}>
                      <Text style={styles.ratingAuthor} numberOfLines={1}>{rating.raterDisplayName}</Text>
                      <Text style={styles.ratingDate}>{formatRelativeDate(rating.createdAt)}</Text>
                    </View>
                    <RatingStars value={rating.stars} size={13} />
                  </View>
                  {rating.comment ? <Text style={styles.ratingComment}>“{rating.comment}”</Text> : null}
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <View style={styles.sectionHeading}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl, paddingTop: Spacing.lg },
  actionsRow: { flexDirection: 'row', alignSelf: 'stretch', gap: Spacing.sm, marginTop: Spacing.md },
  actionButton: { flex: 1 },
  sectionHeading: { paddingHorizontal: Spacing.lg, marginTop: Spacing.xxl, marginBottom: Spacing.md },
  sectionEyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  sectionTitle: { ...Typography.heading, marginTop: 2 },
  grid: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  column: { gap: Spacing.lg },
  ratingsList: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  ratingHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  ratingAuthorBlock: { flex: 1 },
  ratingAuthor: { ...Typography.bodyStrong, fontSize: 14 },
  ratingComment: { ...Typography.body, fontStyle: 'italic' },
  ratingDate: { ...Typography.micro, fontSize: 9 },
});
