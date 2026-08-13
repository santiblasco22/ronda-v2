import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { HitSlop, MIN_TOUCH_TARGET, Radius, Spacing, Typography } from '@/constants/theme';

/**
 * Encabezado de las pantallas con tabs (que no usan el header nativo del
 * Stack). Mantiene el mismo ritmo de márgenes y tamaño de título en todas.
 */
export function ScreenHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

/** Botón de icono con área táctil de 44px aunque el dibujo sea chico. */
export function HeaderIconButton({
  icon,
  label,
  onPress,
  tone = 'muted',
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'muted' | 'primary';
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HitSlop.small}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
    >
      <Ionicons
        name={icon}
        size={22}
        color={tone === 'primary' ? Colors.primaryInk : Colors.textMuted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.caption,
  },
  iconButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonPressed: {
    backgroundColor: Colors.primarySoft,
  },
});
