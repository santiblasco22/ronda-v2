import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { LoadingView } from '@/components/EmptyState';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_LISTING_DESCRIPTION_LENGTH, MAX_LISTING_TITLE_LENGTH } from '@/constants/limits';
import { useDeleteListing, useListing, useSetListingStatus, useUpdateListing } from '@/features/listings/useListings';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_SIZES,
  type Listing,
  type ListingCategory,
  type ListingCondition,
  type ListingSize,
  type ListingStatus,
} from '@/types/models';
import { isPermissionDenied } from '@/utils/errors';
import { validatePrice } from '@/utils/validators';

const STATUS_OPTIONS: { value: ListingStatus; label: string }[] = [
  { value: 'active', label: 'Activo' },
  { value: 'sold', label: 'Vendido' },
  { value: 'archived', label: 'Archivado' },
];

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id);

  if (isLoading || !listing) return <LoadingView />;

  // La key fuerza a remontar el formulario si cambia la publicación,
  // permitiendo inicializar el estado local directamente desde los props
  // sin necesidad de sincronizarlo con un efecto.
  return <EditListingForm key={listing.id} listing={listing} />;
}

function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter();
  const updateListing = useUpdateListing(listing.id);
  const setStatus = useSetListingStatus();
  const deleteListing = useDeleteListing();

  const [title, setTitle] = useState(listing.title);
  const [description, setDescription] = useState(listing.description);
  const [price, setPrice] = useState(String(listing.price));
  const [category, setCategory] = useState<ListingCategory | null>(listing.category);
  const [size, setSize] = useState<ListingSize | null>(listing.size);
  const [condition, setCondition] = useState<ListingCondition | null>(listing.condition);
  const [color, setColor] = useState(listing.color);
  const [city, setCity] = useState(listing.city);
  const [photos, setPhotos] = useState<PickedPhoto[]>(
    listing.photos.map((url) => ({ uri: url, isLocal: false }))
  );
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const priceError = validatePrice(price);
    if (priceError) return setError(priceError);
    if (!category || !size || !condition) return setError('Completá categoría, talle y estado.');
    if (photos.length === 0) return setError('Necesitás al menos una foto.');

    try {
      await updateListing.mutateAsync({
        title,
        description,
        price: Number(price),
        category,
        size,
        condition,
        color,
        city,
        keepPhotos: photos.filter((p) => !p.isLocal).map((p) => p.uri),
        addLocalPhotoUris: photos.filter((p) => p.isLocal).map((p) => p.uri),
      });
      router.back();
    } catch {
      setError('No pudimos guardar los cambios.');
    }
  }

  function handleStatusChange(next: ListingStatus) {
    if (next === listing.status) return;
    setStatus.mutate(
      { listingId: listing.id, nextStatus: next, previousStatus: listing.status },
      {
        onError: (err) => {
          setError(
            isPermissionDenied(err)
              ? 'No podés reactivar esta publicación: llegaste al límite de publicaciones activas de tu plan.'
              : 'No pudimos cambiar el estado de la publicación.'
          );
        },
      }
    );
  }

  function handleDelete() {
    Alert.alert('Eliminar publicación', '¿Seguro que querés eliminarla? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteListing.mutateAsync(listing);
          router.back();
        },
      },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Editar publicación</Text>

        <Text style={styles.label}>Estado de la publicación</Text>
        <View style={styles.chipsRow}>
          {STATUS_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              label={option.label}
              selected={listing.status === option.value}
              onPress={() => handleStatusChange(option.value)}
            />
          ))}
        </View>

        <Text style={styles.label}>Fotos</Text>
        <PhotoPicker photos={photos} onChange={setPhotos} />

        <TextField label="Título" value={title} onChangeText={setTitle} maxLength={MAX_LISTING_TITLE_LENGTH} />
        <TextField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          maxLength={MAX_LISTING_DESCRIPTION_LENGTH}
          multiline
          numberOfLines={4}
          style={styles.textarea}
        />
        <TextField label="Precio" keyboardType="numeric" value={price} onChangeText={setPrice} />

        <Text style={styles.label}>Categoría</Text>
        <View style={styles.chipsRow}>
          {LISTING_CATEGORIES.map((item) => (
            <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />
          ))}
        </View>

        <Text style={styles.label}>Talle</Text>
        <View style={styles.chipsRow}>
          {LISTING_SIZES.map((item) => (
            <Chip key={item} label={item} selected={size === item} onPress={() => setSize(item)} />
          ))}
        </View>

        <Text style={styles.label}>Estado de la prenda</Text>
        <View style={styles.chipsRow}>
          {LISTING_CONDITIONS.map((item) => (
            <Chip key={item} label={item} selected={condition === item} onPress={() => setCondition(item)} />
          ))}
        </View>

        <TextField label="Color" value={color} onChangeText={setColor} />
        <TextField label="Ciudad" value={city} onChangeText={setCity} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Guardar cambios" onPress={handleSave} loading={updateListing.isPending} style={styles.saveButton} />
        <Button
          label="Eliminar publicación"
          variant="danger"
          onPress={handleDelete}
          loading={deleteListing.isPending}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 10,
  },
});
