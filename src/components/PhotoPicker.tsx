import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/colors';
import { MAX_LISTING_PHOTOS } from '@/constants/limits';

export interface PickedPhoto {
  /** URL ya subida (al editar) o URI local recién elegida. */
  uri: string;
  isLocal: boolean;
}

export function PhotoPicker({
  photos,
  onChange,
  max = MAX_LISTING_PHOTOS,
}: {
  photos: PickedPhoto[];
  onChange: (next: PickedPhoto[]) => void;
  max?: number;
}) {
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
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((photo, index) => (
          <View key={`${photo.uri}-${index}`} style={styles.thumbWrapper}>
            <Image source={{ uri: photo.uri }} style={styles.thumb} contentFit="cover" />
            <Pressable style={styles.removeButton} onPress={() => removeAt(index)}>
              <Ionicons name="close" size={14} color={Colors.white} />
            </Pressable>
          </View>
        ))}
        {photos.length < max ? (
          <Pressable style={styles.addButton} onPress={pickPhoto}>
            <Ionicons name="camera-outline" size={26} color={Colors.primary} />
            <Text style={styles.addLabel}>Agregar</Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <Text style={styles.hint}>
        {photos.length}/{max} fotos
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 10,
    paddingVertical: 4,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addLabel: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  hint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
