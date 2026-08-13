import { Ionicons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { ProBadge } from '@/components/StatusBadge';
import { SocialLinksRow } from '@/components/SocialLinksRow';
import { Colors } from '@/constants/colors';
import { getListingCapFor } from '@/constants/limits';
import { signOut } from '@/features/auth/authApi';
import { useMyListings } from '@/features/listings/useListings';
import { useLatestProRequest } from '@/features/pro/useProRequest';
import { useRefreshOwnAggregates } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings } = useMyListings();
  const { data: proRequest } = useLatestProRequest();
  const refreshAggregates = useRefreshOwnAggregates();

  useEffect(() => {
    refreshAggregates.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!profile) return null;

  const cap = getListingCapFor(profile.isPro);
  const activeListings = (listings ?? []).filter((l) => l.status === 'active').slice(0, 6);

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Perfil</Text>
          <Pressable onPress={() => signOut()}>
            <Ionicons name="log-out-outline" size={24} color={Colors.textMuted} />
          </Pressable>
        </View>

        <View style={styles.profileCard}>
          <Avatar url={profile.avatarUrl} name={profile.displayName} size={84} />
          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{profile.displayName}</Text>
            {profile.isPro ? <ProBadge /> : null}
          </View>
          <Text style={styles.username}>@{profile.username}</Text>
          {profile.city ? <Text style={styles.city}>📍 {profile.city}</Text> : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <RatingStars value={profile.ratingAvg} count={profile.ratingCount} showValue size={18} />

          <View style={styles.statsRow}>
            <Link href={{ pathname: '/followers/[id]', params: { id: profile.uid } }} asChild>
              <Pressable style={styles.stat}>
                <Text style={styles.statNumber}>{profile.followerCount}</Text>
                <Text style={styles.statLabel}>Seguidores</Text>
              </Pressable>
            </Link>
            <Link href={{ pathname: '/following/[id]', params: { id: profile.uid } }} asChild>
              <Pressable style={styles.stat}>
                <Text style={styles.statNumber}>{profile.followingCount}</Text>
                <Text style={styles.statLabel}>Siguiendo</Text>
              </Pressable>
            </Link>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>
                {profile.activeListingCount}/{cap}
              </Text>
              <Text style={styles.statLabel}>Publicaciones</Text>
            </View>
          </View>

          <SocialLinksRow links={profile.socialLinks} />

          <View style={styles.actionsRow}>
            <Button label="Editar perfil" variant="outline" small onPress={() => router.push('/edit-profile')} />
            <Button
              label="Mis publicaciones"
              variant="outline"
              small
              onPress={() => router.push('/my-listings')}
            />
          </View>

          {!profile.isPro ? (
            <Button
              label={
                proRequest?.status === 'pending'
                  ? 'Solicitud PRO en revisión'
                  : proRequest?.status === 'rejected'
                    ? 'Volver a solicitar cuenta PRO'
                    : 'Solicitar cuenta PRO'
              }
              variant="secondary"
              disabled={proRequest?.status === 'pending'}
              style={styles.proButton}
              onPress={() => router.push('/pro-request')}
            />
          ) : null}

          <Button
            label="Publicar prenda"
            onPress={() => router.push('/listing/new')}
            style={styles.newListingButton}
          />
        </View>

        <Text style={styles.sectionTitle}>Mis publicaciones activas</Text>
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
              title="Todavía no publicaste nada"
              subtitle="Tocá 'Publicar prenda' para empezar a vender."
            />
          }
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.text,
  },
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
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
  proButton: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
  newListingButton: {
    marginTop: 10,
    alignSelf: 'stretch',
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
