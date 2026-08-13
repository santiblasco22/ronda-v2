import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';

export function Screen({
  children,
  style,
  padded = true,
  bottomSafe = false,
}: {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
  bottomSafe?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={bottomSafe ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}>
      <View style={[styles.content, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: Spacing.lg,
  },
});
