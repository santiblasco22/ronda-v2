import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export function FormSection({
  icon,
  title,
  caption,
  children,
  style,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  caption?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.section, style]}>
      <View style={styles.header}>
        {icon ? (
          <View style={styles.icon}>
            <Ionicons name={icon} size={18} color={Colors.primaryInk} />
          </View>
        ) : null}
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          {caption ? <Text style={styles.caption}>{caption}</Text> : null}
        </View>
      </View>
      {children}
    </View>
  );
}

export function InlineNotice({
  message,
  tone = 'danger',
}: {
  message: string;
  tone?: 'danger' | 'info' | 'success';
}) {
  const palette = {
    danger: { background: Colors.dangerSoft, color: Colors.dangerInk, icon: 'alert-circle' as const },
    info: { background: Colors.butterSoft, color: Colors.text, icon: 'information-circle' as const },
    success: { background: Colors.successSoft, color: Colors.successInk, icon: 'checkmark-circle' as const },
  }[tone];

  return (
    <View
      style={[styles.notice, { backgroundColor: palette.background }]}
      accessibilityRole={tone === 'danger' ? 'alert' : undefined}
    >
      <Ionicons name={palette.icon} size={18} color={palette.color} />
      <Text style={[styles.noticeText, { color: palette.color }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 2 },
  title: { ...Typography.sectionTitle },
  caption: { ...Typography.caption },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
  },
  noticeText: {
    ...Typography.caption,
    flex: 1,
    fontWeight: '600',
  },
});
