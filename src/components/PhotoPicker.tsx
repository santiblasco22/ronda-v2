import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MAX_LISTING_PHOTOS } from '@/constants/limits';
import { Radius, Spacing, Typography, hitSlopForSize } from '@/constants/theme';
import {
  PHOTO_UPLOADS_DISABLED_MESSAGE,
  PHOTO_UPLOADS_DISABLED_TITLE,
  photoUploadsEnabled,
} from '@/lib/photoUploads';

export interface PickedPhoto {
  /** URL ya subida (al editar) o URI local recién elegida. */
  uri: string;
  isLocal: boolean;
}

const REMOVE_BUTTON_SIZE = 22;

export function PhotoPicker({
  photos,
  onChange,
  max = MAX_LISTING_PHOTOS,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  max?: number;
}) {
  const canAddMore = photoUploadsEnabled && photos.length < max;

  async function pickPhoto() {
    if (photos.length >= max) {
      Alert.alert('Límite alcanzado', `Podés subir hasta ${max} fotos.`);
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: max - photos.length,
    });
    if (result.canceled) return;
    const picked = result.assets.map((asset) => ({ uri: asset.uri, isLocal: true }));
    onChange([...photos, ...picked].slice(0, max));
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.wrapper}>
      {/* Sin almacenamiento de imágenes no tiene sentido dejar elegir fotos
          que después no se van a poder guardar: se explica en vez de fallar
          al tocar. Las que ya estén cargadas se siguen pudiendo quitar. */}
      {!photoUploadsEnabled ? (
        <View style={styles.disabledCard}>
          <View style={styles.disabledIcon}>
            <Ionicons name="image-outline" size={22} color={Colors.primaryInk} />
          </View>
          <View style={styles.disabledBody}>
            <Text style={styles.disabledTitle}>{PHOTO_UPLOADS_DISABLED_TITLE}</Text>
            <Text style={styles.disabledText}>{PHOTO_UPLOADS_DISABLED_MESSAGE}</Text>
          </View>
        </View>
      ) : null}

      {photos.length === 0 && !canAddMore ? null : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {photos.map((photo, index) => (
            <View key={`${photo.uri}-${index}`} style={styles.thumbWrapper}>
              <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
              <Pressable
                style={styles.removeButton}
                onPress={() => removeAt(index)}
                hitSlop={hitSlopForSize(REMOVE_BUTTON_SIZE)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar la foto ${index + 1}`}
              >
                <Ionicons name="close" size={14} color={Colors.white} />
              </Pressable>
            </View>
          ))}
          {canAddMore ? (
            <Pressable
              style={({ pressed }) => [styles.addButton, pressed && styles.addButtonPressed]}
              onPress={pickPhoto}
              accessibilityRole="button"
              accessibilityLabel="Agregar fotos"
            >
              <Ionicons name="camera-outline" size={26} color={Colors.primaryInk} />
              <Text style={styles.addLabel}>Agregar</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}

      {photoUploadsEnabled ? (
        <Text style={styles.hint}>
          {photos.length}/{max} fotos · la primera es la portada
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.md,
  },
  row: {
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceMuted,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.danger,
    borderRadius: Radius.pill,
    width: REMOVE_BUTTON_SIZE,
    height: REMOVE_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 92,
    height: 92,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.primaryInk,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addButtonPressed: {
    backgroundColor: Colors.primarySoft,
  },
  addLabel: {
    ...Typography.micro,
    color: Colors.primaryInk,
    fontWeight: '700',
  },
  hint: {
    marginTop: Spacing.sm,
    ...Typography.micro,
  },
  disabledCard: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.primarySoft,
  },
  disabledIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBody: {
    flex: 1,
    gap: Spacing.xs,
  },
  disabledTitle: {
    ...Typography.sectionTitle,
  },
  disabledText: {
    ...Typography.caption,
    color: Colors.text,
  },
});
