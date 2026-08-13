import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { MIN_TOUCH_TARGET, Radius, Spacing, Typography } from '@/constants/theme';

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
    minHeight: MIN_TOUCH_TARGET,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  small: {
    minHeight: 36,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...Typography.bodyStrong,
    fontSize: 16,
  },
  smallLabel: {
    fontSize: 14,
  },
});

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primary },
  secondary: { backgroundColor: Colors.text },
  outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primaryInk },
  danger: { backgroundColor: Colors.danger },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: Spacing.md },
};

const pressedStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Colors.primaryPressed },
  secondary: { opacity: 0.85 },
  outline: { backgroundColor: Colors.primarySoft },
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
