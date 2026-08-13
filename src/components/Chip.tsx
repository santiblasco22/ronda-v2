import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/colors';
import { HitSlop, Radius, Spacing, Typography } from '@/constants/theme';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={HitSlop.small}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && !selected && styles.chipPressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryPressed,
  },
  chipPressed: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primarySoft,
  },
  label: {
    ...Typography.caption,
    color: Colors.text,
    fontWeight: '600',
  },
  labelSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '700',
  },
});
