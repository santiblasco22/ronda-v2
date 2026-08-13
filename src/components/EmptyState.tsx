import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';

import { Button } from './Button';

type Tone = 'neutral' | 'warning' | 'danger';

export function EmptyState({
  icon = 'sparkles-outline',
  title,
  subtitle,
  tone = 'neutral',
  actionLabel,
  onAction,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const palette = TONES[tone];

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>HACEMOS OTRA RONDA</Text>
      <View style={[styles.iconCircle, { backgroundColor: palette.background }]}>
        <Ionicons name={icon} size={30} color={palette.icon} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} variant="outline" small style={styles.action} />
      ) : null}
    </View>
  );
}

export function LoadingView({ label = 'Cargando…' }: { label?: string }) {
  return (
    <View style={styles.loadingContainer} accessibilityRole="progressbar" accessibilityLabel={label}>
      <View style={styles.loadingIcon}>
        <ActivityIndicator color={Colors.primaryInk} />
      </View>
      <Text style={styles.loadingLabel}>{label}</Text>
    </View>
  );
}

const TONES: Record<Tone, { background: string; icon: string }> = {
  neutral: { background: Colors.primarySoft, icon: Colors.primaryInk },
  warning: { background: Colors.primarySoft, icon: Colors.primaryInk },
  danger: { background: Colors.dangerSoft, icon: Colors.dangerInk },
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
    margin: Spacing.lg,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.heading,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.md,
  },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
  },
  loadingContainer: {
    flex: 1,
    minHeight: 220,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  loadingIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  loadingLabel: { ...Typography.caption, fontWeight: '600' },
});
