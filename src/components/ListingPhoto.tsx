import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';

/**
 * Foto de una publicación con marcador de posición.
 *
 * Muchas publicaciones no tienen imagen (Storage puede estar deshabilitado),
 * así que el caso "sin foto" es normal y tiene que verse cuidado: un rectángulo
 * crema con una percha y, si hay lugar, una leyenda.
 */
export function ListingPhoto({
  uri,
  style,
  iconSize = 28,
  label,
}: {
  uri?: string;
  style?: StyleProp<ImageStyle>;
  iconSize?: number;
  label?: string;
}) {
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, style]}
        contentFit="cover"
        transition={180}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.image, styles.placeholder, style]} accessibilityLabel="Publicación sin foto">
      <View style={styles.pattern}>
        <View style={[styles.patternLine, styles.patternLineOne]} />
        <View style={[styles.patternLine, styles.patternLineTwo]} />
        <View style={[styles.patternDot, styles.patternDotOne]} />
        <View style={[styles.patternDot, styles.patternDotTwo]} />
      </View>
      <View style={styles.iconPatch}>
        <Ionicons name="shirt-outline" size={iconSize} color={Colors.plum} />
      </View>
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceMuted,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.butterSoft,
    overflow: 'hidden',
  },
  pattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.35,
  },
  patternLine: {
    position: 'absolute',
    height: 1.5,
    width: '150%',
    backgroundColor: Colors.primary,
    transform: [{ rotate: '-34deg' }],
  },
  patternLineOne: { top: '25%', left: '-25%' },
  patternLineTwo: { bottom: '24%', left: '-25%' },
  patternDot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 999,
    backgroundColor: Colors.plum,
  },
  patternDotOne: { top: '18%', right: '16%' },
  patternDotTwo: { bottom: '14%', left: '13%' },
  iconPatch: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: 'rgba(255,252,248,0.82)',
    borderWidth: 1,
    borderColor: Colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-3deg' }],
  },
  label: {
    ...Typography.micro,
    color: Colors.plum,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
