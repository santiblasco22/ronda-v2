import { Link, Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FollowButton } from '@/components/FollowButton';
import { ListingCard } from '@/components/ListingCard';
import { Screen } from '@/components/Screen';
import { RatingStars } from '@/components/RatingStars';
import { ProBadge } from '@/components/StatusBadge';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { Colors } from '@/constants/colors';
import { useUserListings } from '@/features/listings/useListings';
import { useUserProfile, useUserStats } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: profile, isLoading } = useUserProfile(id);
  const { data: listings } = useUserListings(id);
  const { data: stats } = useUserStats(id);

  if (isLoading || !profile) return <LoadingView />;

  const isMe = myUid === profile.uid;
  const activeListings = (listings ?? []).filter((l) => l.status === 'active');

  return (
    <Screen padded={false}>
      <Stack.Screen options={{ title: `@${profile.username}` }} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.profileCard}>
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
              <Pressable style={styles.stat} accessibilityRole="button">
                <Text style={styles.statNumber}>{formatCount(stats?.followers)}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </Pressable>
            </Link>
            <Link href={{ pathname: '/following/[id]', params: { id: profile.uid } }} asChild>
              <Pressable style={styles.stat} accessibilityRole="button">
                <Text style={styles.statNumber}>{formatCount(stats?.following)}</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </Pressable>
            </Link>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{formatCount(stats?.activeListings)}</Text>
              <Text style={styles.statLabel}>Publicaciones</Text>
            </View>
          </View>

          <SocialLinksRow links={profile.socialLinks} />

          {!isMe ? (
            <View style={styles.actionsRow}>
              <FollowButton target={profile} />
              <Button
                label="Calificar"
                variant="outline"
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
            <EmptyState icon="shirt-outline" title="Sin publicaciones activas" />
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
    paddingBottom: 40,
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  username: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  city: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  bio: {
    fontSize: 14,
    color: Colors.text,
    textAlign: 'center',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  grid: {
    paddingHorizontal: 16,
  },
  column: {
    gap: 12,
    marginBottom: 12,
  },
});
