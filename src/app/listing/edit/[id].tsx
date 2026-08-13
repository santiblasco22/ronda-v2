import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FormSection, InlineNotice } from '@/components/FormSection';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_LISTING_DESCRIPTION_LENGTH, MAX_LISTING_TITLE_LENGTH } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useDeleteListing, useListing, useSetListingStatus, useUpdateListing } from '@/features/listings/useListings';
import { PhotoUploadError } from '@/lib/photoUploads';
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
  { value: 'active', label: 'En vidriera' },
  { value: 'sold', label: 'Vendida' },
  { value: 'archived', label: 'Archivada' },
];

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading, isError, refetch } = useListing(id);

  if (isLoading) return <LoadingView label="Abriendo la publicación…" />;
  if (isError) {
    return (
      <Screen>
        <EmptyState icon="cloud-offline-outline" tone="danger" title="No pudimos abrir esta publicación" subtitle="Revisá tu conexión y volvé a intentar." actionLabel="Reintentar" onAction={() => refetch()} />
      </Screen>
    );
  }
  if (!listing) {
    return (
      <Screen>
        <EmptyState icon="shirt-outline" title="Esta publicación ya no existe" actionLabel="Volver" onAction={() => router.back()} />
      </Screen>
    );
  }
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
  const [photos, setPhotos] = useState<PickedPhoto[]>(listing.photos.map((url) => ({ uri: url, isLocal: false })));
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (!title.trim()) return setError('Ingresá un título.');
    const priceError = validatePrice(price);
    if (priceError) return setError(priceError);
    if (!category || !size || !condition) return setError('Completá categoría, talle y estado.');
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
        keepPhotos: photos.filter((photo) => !photo.isLocal).map((photo) => photo.uri),
        addLocalPhotoUris: photos.filter((photo) => photo.isLocal).map((photo) => photo.uri),
      });
      router.back();
    } catch (err) {
      setError(err instanceof PhotoUploadError ? err.message : 'No pudimos guardar los cambios.');
    }
  }

  function handleStatusChange(next: ListingStatus) {
    if (next === listing.status) return;
    setStatus.mutate(
      { listingId: listing.id, nextStatus: next, previousStatus: listing.status },
      {
        onError: (err) => setError(isPermissionDenied(err) ? 'No podés reactivar esta publicación: tu vidriera ya está completa.' : 'No pudimos cambiar el estado de la publicación.'),
      }
    );
  }

  function handleDelete() {
    Alert.alert('Eliminar publicación', '¿Seguro que querés eliminarla? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => { await deleteListing.mutateAsync(listing); router.back(); } },
    ]);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>GESTIONAR PRENDA</Text>
          <Text style={styles.title}>Dale una vuelta a tu publicación.</Text>
          <Text style={styles.subtitle}>Actualizá los detalles o cambiá su lugar en la vidriera.</Text>
        </View>

        <FormSection icon="eye-outline" title="Visibilidad" caption="Solo las prendas en vidriera aparecen en Descubrir y Buscar">
          <View style={styles.chipsRow}>
            {STATUS_OPTIONS.map((option) => <Chip key={option.value} label={option.label} selected={listing.status === option.value} onPress={() => handleStatusChange(option.value)} />)}
          </View>
          {setStatus.isPending ? <Text style={styles.savingStatus}>Actualizando estado…</Text> : null}
        </FormSection>

        <FormSection icon="camera-outline" title="Fotos" caption="Opcionales · la primera funciona como portada">
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </FormSection>

        <FormSection icon="pricetag-outline" title="Lo esencial">
          <TextField label="Título" value={title} onChangeText={setTitle} maxLength={MAX_LISTING_TITLE_LENGTH} showCounter />
          <TextField label="Precio en pesos" keyboardType="numeric" value={price} onChangeText={setPrice} />
          <TextField label="Descripción (opcional)" value={description} onChangeText={setDescription} maxLength={MAX_LISTING_DESCRIPTION_LENGTH} showCounter multiline numberOfLines={4} style={styles.textarea} />
        </FormSection>

        <FormSection icon="options-outline" title="Cómo es">
          <ChoiceGroup label="Categoría">{LISTING_CATEGORIES.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}</ChoiceGroup>
          <ChoiceGroup label="Talle">{LISTING_SIZES.map((item) => <Chip key={item} label={item} selected={size === item} onPress={() => setSize(item)} />)}</ChoiceGroup>
          <ChoiceGroup label="Estado de la prenda">{LISTING_CONDITIONS.map((item) => <Chip key={item} label={item} selected={condition === item} onPress={() => setCondition(item)} />)}</ChoiceGroup>
        </FormSection>

        <FormSection icon="location-outline" title="Detalles">
          <TextField label="Color" value={color} onChangeText={setColor} />
          <TextField label="Ciudad" value={city} onChangeText={setCity} />
        </FormSection>

        {error ? <InlineNotice message={error} /> : null}
        <Button label="Guardar cambios" icon="checkmark" onPress={handleSave} loading={updateListing.isPending} style={styles.saveButton} />

        <View style={styles.dangerZone}>
          <View style={styles.dangerTitleRow}>
            <Ionicons name="trash-outline" size={18} color={Colors.dangerInk} />
            <Text style={styles.dangerTitle}>Eliminar definitivamente</Text>
          </View>
          <Text style={styles.dangerBody}>Esta acción borra la publicación y no se puede revertir.</Text>
          <Button label="Eliminar publicación" variant="danger" onPress={handleDelete} loading={deleteListing.isPending} small />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return <View style={styles.choiceGroup}><Text style={styles.choiceLabel}>{label}</Text><View style={styles.chipsRow}>{children}</View></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.jumbo, gap: Spacing.lg },
  intro: { paddingHorizontal: Spacing.xs, marginBottom: Spacing.xs },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  title: { ...Typography.title, marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  choiceGroup: { gap: Spacing.sm },
  choiceLabel: { ...Typography.label },
  savingStatus: { ...Typography.caption, color: Colors.primaryInk },
  textarea: { height: 112, textAlignVertical: 'top', paddingTop: Spacing.md },
  saveButton: { marginTop: Spacing.sm },
  dangerZone: { borderWidth: 1, borderColor: Colors.dangerInk, borderRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md, backgroundColor: Colors.dangerSoft },
  dangerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  dangerTitle: { ...Typography.sectionTitle, color: Colors.dangerInk },
  dangerBody: { ...Typography.caption, color: Colors.dangerInk },
});
