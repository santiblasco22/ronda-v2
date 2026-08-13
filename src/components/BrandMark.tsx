import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

/** Isologo construido con vistas para que funcione igual sin assets remotos. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  const size = compact ? 42 : 72;

  return (
    <View style={styles.lockup} accessibilityLabel="Ronda">
      <View style={[styles.mark, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={require('../../assets/images/ronda-mark.png')}
          style={styles.markImage}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
      </View>
      <Text style={[styles.wordmark, !compact && styles.wordmarkLarge]}>ronda</Text>
    </View>
  );
}

export function WardrobeMotif() {
  return (
    <View style={styles.motif} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.fabric, styles.fabricBack]} />
      <View style={[styles.fabric, styles.fabricMiddle]} />
      <View style={[styles.fabric, styles.fabricFront]}>
        <View style={styles.neck} />
        <View style={styles.seam} />
        <View style={styles.button} />
        <View style={[styles.button, styles.buttonTwo]} />
      </View>
      <View style={styles.motifSpark} />
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  mark: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.butterSoft,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    ...Shadows.card,
  },
  markImage: { width: '100%', height: '100%' },
  wordmark: {
    ...Typography.heading,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6,
  },
  wordmarkLarge: { fontSize: 28 },
  motif: {
    width: 164,
    height: 138,
    alignSelf: 'center',
    marginVertical: Spacing.sm,
  },
  fabric: {
    position: 'absolute',
    width: 104,
    height: 116,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.text,
  },
  fabricBack: {
    left: 4,
    top: 13,
    backgroundColor: Colors.butter,
    transform: [{ rotate: '-10deg' }],
  },
  fabricMiddle: {
    right: 4,
    top: 12,
    backgroundColor: Colors.plumSoft,
    transform: [{ rotate: '10deg' }],
  },
  fabricFront: {
    left: 30,
    top: 4,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
  },
  neck: {
    width: 34,
    height: 17,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1.5,
    borderTopWidth: 0,
    borderColor: Colors.text,
  },
  seam: {
    position: 'absolute',
    top: 29,
    bottom: 13,
    width: 1.5,
    backgroundColor: Colors.text,
    opacity: 0.6,
  },
  button: {
    position: 'absolute',
    top: 43,
    width: 6,
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.plum,
  },
  buttonTwo: { top: 65 },
  motifSpark: {
    position: 'absolute',
    right: 7,
    top: 0,
    width: 15,
    height: 15,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    transform: [{ rotate: '45deg' }],
  },
});
