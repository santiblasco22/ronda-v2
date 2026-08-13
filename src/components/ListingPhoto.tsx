import { Ionicons } from '@expo/vector-icons';
import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

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
  style?: ImageStyle;
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
      <Ionicons name="shirt-outline" size={iconSize} color={Colors.primaryInk} />
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
    backgroundColor: Colors.primarySoft,
  },
  label: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textAlign: 'center',
    paddingHorizontal: Spacing.md,
  },
});
