import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import type { ListingStatus } from '@/types/models';

const LABELS: Record<ListingStatus, string> = {
  active: 'Activo',
  sold: 'Vendido',
  archived: 'Archivado',
};

const BACKGROUNDS: Record<ListingStatus, string> = {
  active: Colors.primarySoft,
  sold: '#DCEFE4',
  archived: '#EDEAE3',
};

const TEXT_COLORS: Record<ListingStatus, string> = {
  active: Colors.primaryDark,
  sold: Colors.accent,
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
    <View style={styles.proBadge}>
      <Text style={styles.proLabel}>PRO</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  proBadge: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proLabel: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});
