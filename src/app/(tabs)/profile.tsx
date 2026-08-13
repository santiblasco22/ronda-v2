import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { ListingCard } from '@/components/ListingCard';
import { ProfileHero } from '@/components/ProfileHero';
import { Screen } from '@/components/Screen';
import { HeaderIconButton, ScreenHeader } from '@/components/ScreenHeader';
import { Colors } from '@/constants/colors';
import { getListingCapFor } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { signOut } from '@/features/auth/authApi';
import { useMyListings } from '@/features/listings/useListings';
import { useLatestProRequest } from '@/features/pro/useProRequest';
import { useUserStats } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

const PREVIEW_LISTINGS = 4;

export default function ProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const { data: listings, isError: listingsError, refetch: refetchListings } = useMyListings();
  const { data: proRequest } = useLatestProRequest();
  const { data: stats } = useUserStats(profile?.uid);

  if (!profile) return null;

  const cap = getListingCapFor(profile.isPro);
  const activeListings = (listings ?? []).filter((listing) => listing.status === 'active');
  const preview = activeListings.slice(0, PREVIEW_LISTINGS);
  const remainingSlots = Math.max(cap - profile.activeListingCount, 0);
  const hasSocialLinks = Boolean(
    profile.socialLinks.instagram || profile.socialLinks.whatsapp || profile.socialLinks.facebook
  );

  return (
    <Screen padded={false}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Mi ropero"
          subtitle="Tu identidad y tus prendas en un solo lugar"
          action={<HeaderIconButton icon="log-out-outline" label="Cerrar sesión" onPress={() => signOut()} />}
        />

        <ProfileHero
          profile={profile}
          stats={stats}
          listingValue={`${profile.activeListingCount}/${cap}`}
          listingLabel="En vidriera"
        >
          {!hasSocialLinks ? (
            <Pressable onPress={() => router.push('/edit-profile')} accessibilityRole="button" style={styles.addLinksHint}>
              <Ionicons name="link-outline" size={16} color={Colors.primaryInk} />
              <Text style={styles.addLinksText}>Sumá una red para que puedan contactarte</Text>
            </Pressable>
          ) : null}

          <Button
            label="Publicar una prenda"
            icon="add"
            onPress={() => router.push('/listing/new')}
            style={styles.primaryAction}
          />
          <View style={styles.secondaryActions}>
            <Button label="Editar perfil" variant="outline" small onPress={() => router.push('/edit-profile')} style={styles.secondaryButton} />
            <Button label="Gestionar prendas" variant="outline" small onPress={() => router.push('/my-listings')} style={styles.secondaryButton} />
          </View>

          {!profile.isPro ? (
            <Pressable
              style={({ pressed }) => [styles.proCard, pressed && styles.proCardPressed]}
              onPress={() => router.push('/pro-request')}
              disabled={proRequest?.status === 'pending'}
              accessibilityRole="button"
            >
              <View style={styles.proIcon}>
                <Ionicons name="sparkles" size={19} color={Colors.plum} />
              </View>
              <View style={styles.proText}>
                <Text style={styles.proTitle}>
                  {proRequest?.status === 'pending' ? 'Solicitud PRO en revisión' : '¿Tenés un emprendimiento?'}
                </Text>
                <Text style={styles.proBody}>
                  {proRequest?.status === 'pending'
                    ? 'Te avisamos apenas la revisemos.'
                    : `Te quedan ${remainingSlots} lugares. Con PRO podés mostrar hasta 50 prendas.`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.plum} />
            </Pressable>
          ) : null}
        </ProfileHero>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>TU VIDRIERA</Text>
            <Text style={styles.sectionTitle}>Publicaciones activas</Text>
          </View>
          {activeListings.length > PREVIEW_LISTINGS ? (
            <Pressable onPress={() => router.push('/my-listings')} accessibilityRole="button" style={styles.sectionLinkButton}>
              <Text style={styles.sectionLink}>Ver todas</Text>
            </Pressable>
          ) : null}
        </View>

        {listingsError ? (
          <EmptyState icon="cloud-offline-outline" tone="danger" title="No pudimos abrir tu vidriera" subtitle="Tu perfil está bien; solo falta volver a cargar las prendas." actionLabel="Reintentar" onAction={() => refetchListings()} />
        ) : (
          <FlatList
            data={preview}
            numColumns={2}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            columnWrapperStyle={styles.column}
            contentContainerStyle={styles.grid}
            renderItem={({ item }) => <ListingCard listing={item} />}
            ListEmptyComponent={<EmptyState icon="shirt-outline" title="Tu vidriera está lista para estrenarse" subtitle="Título, precio, talle y estado alcanzan. La foto es opcional." actionLabel="Publicar mi primera prenda" onAction={() => router.push('/listing/new')} />}
          />
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: Spacing.xxxl },
  addLinksHint: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  addLinksText: { ...Typography.caption, color: Colors.primaryInk, fontWeight: '700' },
  primaryAction: { alignSelf: 'stretch', marginTop: Spacing.md },
  secondaryActions: { flexDirection: 'row', alignSelf: 'stretch', gap: Spacing.sm },
  secondaryButton: { flex: 1 },
  proCard: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.butterSoft,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  proCardPressed: { opacity: 0.82 },
  proIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  proText: { flex: 1 },
  proTitle: { ...Typography.label },
  proBody: { ...Typography.caption },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionEyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  sectionTitle: { ...Typography.heading, fontSize: 20 },
  sectionLinkButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  sectionLink: { ...Typography.label, color: Colors.primaryInk },
  grid: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },
  column: { gap: Spacing.lg },
});
