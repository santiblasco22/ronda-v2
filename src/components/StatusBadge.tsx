import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
import type { ListingStatus } from '@/types/models';

const LABELS: Record<ListingStatus, string> = {
  active: 'Activo',
  sold: 'Vendido',
  archived: 'Archivado',
};

const BACKGROUNDS: Record<ListingStatus, string> = {
  active: Colors.primarySoft,
  sold: Colors.successSoft,
  archived: Colors.surfaceMuted,
};

const TEXT_COLORS: Record<ListingStatus, string> = {
  active: Colors.primaryInk,
  sold: Colors.successInk,
  archived: Colors.textMuted,
};

export function StatusBadge({ status }: { status: ListingStatus }) {
  return (
    <View style={[styles.badge, { backgroundColor: BACKGROUNDS[status] }]}>
      <Text style={[styles.label, { color: TEXT_COLORS[status] }]}>{LABELS[status]}</Text>
    </View>
  );
}

export function ProBadge() {
  return (
    <View style={styles.proBadge} accessibilityLabel="Cuenta PRO">
      <Text style={styles.proLabel}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.micro,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: Colors.gold,
    borderRadius: Radius.sm - 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  proLabel: {
    // Tinta oscura sobre el dorado: en blanco el contraste era ~2:1.
    color: Colors.text,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
