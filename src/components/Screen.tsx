import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';

export function Screen({
  children,
  style,
  padded = true,
}: {
  children: ReactNode;
  style?: ViewStyle;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  padded: {
    flex: 1,
    paddingHorizontal: 16,
  },
});
