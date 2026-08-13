import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import type { UserProfile, UserStats } from '@/types/models';

import { Avatar } from './Avatar';
import { RatingStars } from './RatingStars';
import { SocialLinksRow } from './SocialLinksRow';
import { ProBadge } from './StatusBadge';

export function ProfileHero({
  profile,
  stats,
  listingValue,
  listingLabel = 'Publicadas',
  children,
}: {
  profile: UserProfile;
  stats?: UserStats;
  listingValue: string;
  listingLabel?: string;
  children?: ReactNode;
}) {
  const hasSocialLinks = Boolean(
    profile.socialLinks.instagram || profile.socialLinks.whatsapp || profile.socialLinks.facebook
  );

  return (
    <View style={styles.shell}>
      <View style={styles.cover} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={styles.coverLoop} />
        <View style={styles.coverPatch} />
        <View style={styles.coverStitch} />
      </View>
      <View style={styles.avatarWrap}>
        <Avatar url={profile.avatarUrl} name={profile.displayName} size={92} />
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName}>{profile.displayName}</Text>
          {profile.isPro ? <ProBadge /> : null}
        </View>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.city ? (
          <View style={styles.cityRow}>
            <Ionicons name="location" size={13} color={Colors.primaryInk} />
            <Text style={styles.city}>{profile.city}</Text>
          </View>
        ) : null}
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

        <View style={styles.ratingWrap}>
          <RatingStars value={stats?.ratingAvg ?? 0} count={stats?.ratingCount ?? 0} showValue size={17} />
        </View>

        <View style={styles.statsRow}>
          <StatLink
            href={{ pathname: '/followers/[id]', params: { id: profile.uid } }}
            value={formatCount(stats?.followers)}
            label="Seguidores"
          />
          <View style={styles.statDivider} />
          <StatLink
            href={{ pathname: '/following/[id]', params: { id: profile.uid } }}
            value={formatCount(stats?.following)}
            label="Siguiendo"
          />
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{listingValue}</Text>
            <Text style={styles.statLabel}>{listingLabel}</Text>
          </View>
        </View>

        {hasSocialLinks ? <SocialLinksRow links={profile.socialLinks} /> : null}
        {children}
      </View>
    </View>
  );
}

function StatLink({
  href,
  value,
  label,
}: {
  href: { pathname: '/followers/[id]' | '/following/[id]'; params: { id: string } };
  value: string;
  label: string;
}) {
  return (
    <Link href={href} asChild>
      <Pressable style={styles.stat} accessibilityRole="button" accessibilityLabel={`${label}: ${value}`}>
        <Text style={styles.statNumber}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Pressable>
    </Link>
  );
}

function formatCount(value: number | undefined): string {
  return value === undefined ? '—' : String(value);
}

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadows.card,
  },
  cover: {
    height: 104,
    backgroundColor: Colors.plum,
    overflow: 'hidden',
  },
  coverLoop: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 22,
    borderColor: 'rgba(241,121,95,0.6)',
    right: -18,
    top: -54,
  },
  coverPatch: {
    position: 'absolute',
    width: 70,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: Colors.butter,
    left: 24,
    top: 22,
    transform: [{ rotate: '-7deg' }],
  },
  coverStitch: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 13,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,249,244,0.5)',
  },
  avatarWrap: {
    alignSelf: 'center',
    marginTop: -48,
    padding: 4,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  displayName: { ...Typography.heading, fontSize: 23, textAlign: 'center' },
  username: { ...Typography.caption, fontWeight: '700' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  city: { ...Typography.caption, color: Colors.primaryInk, fontWeight: '600' },
  bio: { ...Typography.body, textAlign: 'center', maxWidth: 320, marginTop: Spacing.xs },
  ratingWrap: { marginTop: Spacing.sm },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.surfaceTint,
    borderRadius: Radius.lg,
  },
  stat: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 1 },
  statNumber: { ...Typography.heading, fontSize: 18, lineHeight: 22 },
  statLabel: { ...Typography.micro, fontSize: 9, textTransform: 'uppercase' },
  statDivider: { width: 1, height: 28, backgroundColor: Colors.border },
});
