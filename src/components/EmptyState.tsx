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
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}>
      <ActivityIndicator color={Colors.primaryInk} />
      <Text style={styles.subtitle}>{label}</Text>
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
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.xxl,
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  title: {
    ...Typography.heading,
    fontSize: 17,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.caption,
    textAlign: 'center',
    maxWidth: 320,
  },
  action: {
    marginTop: Spacing.md,
  },
});
