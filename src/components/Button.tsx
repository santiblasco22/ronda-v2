import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Texto para lectores de pantalla cuando la etiqueta no alcanza. */
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  small,
  icon,
  accessibilityLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const contentColor = textVariantStyles[variant].color;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(isDisabled), busy: Boolean(loading) }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        variantStyles[variant],
        pressed && !isDisabled && pressedStyles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={contentColor} /> : null}
          <Text
            style={[styles.label, textVariantStyles[variant], small && styles.smallLabel]}
            numberOfLines={1}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  small: {
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.pill,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...Typography.bodyStrong,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  smallLabel: {
    fontSize: 14,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primary, borderWidth: 1.5, borderColor: Colors.text, ...Shadows.card },
  secondary: { backgroundColor: Colors.plum },
  outline: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.borderStrong },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: Spacing.md },
};

const pressedStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primaryPressed, transform: [{ translateY: 1 }] },
  secondary: { opacity: 0.85 },
  outline: { backgroundColor: Colors.primarySoft, borderColor: Colors.primaryInk },
  danger: { opacity: 0.85 },
  ghost: { backgroundColor: Colors.primarySoft },
};

const textVariantStyles: Record<Variant, { color: string }> = {
  primary: { color: Colors.textOnPrimary },
  secondary: { color: Colors.white },
  outline: { color: Colors.primaryInk },
  danger: { color: Colors.white },
  ghost: { color: Colors.primaryInk },
};
