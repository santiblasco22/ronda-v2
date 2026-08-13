import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import {
  getListingCapFor,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_TITLE_LENGTH,
} from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useCreateListing } from '@/features/listings/useListings';
import { PhotoUploadError } from '@/lib/photoUploads';
import { useAuthStore } from '@/store/authStore';
import {
  LISTING_CATEGORIES,
  LISTING_CONDITIONS,
  LISTING_SIZES,
  type ListingCategory,
  type ListingCondition,
  type ListingSize,
} from '@/types/models';
import { isPermissionDenied } from '@/utils/errors';
import { validatePrice } from '@/utils/validators';

export default function NewListingScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const createListing = useCreateListing();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<ListingCategory | null>(null);
  const [size, setSize] = useState<ListingSize | null>(null);
  const [condition, setCondition] = useState<ListingCondition | null>(null);
  const [color, setColor] = useState('');
  const [city, setCity] = useState(profile?.city ?? '');
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;

  const cap = getListingCapFor(profile.isPro);
  const reachedCap = profile.activeListingCount >= cap;

  async function handleSubmit() {
    setError(null);
    if (reachedCap) return;
    if (!title.trim()) return setError('Ingresá un título.');
    const priceError = validatePrice(price);
    if (priceError) return setError(priceError);
    if (!category) return setError('Elegí una categoría.');
    if (!size) return setError('Elegí un talle.');
    if (!condition) return setError('Elegí el estado de la prenda.');

    try {
      const id = await createListing.mutateAsync({
        title,
        description,
        price: Number(price),
        category,
        size,
        condition,
        color,
        city,
        localPhotoUris: photos.map((p) => p.uri),
      });
      router.replace({ pathname: '/listing/[id]', params: { id } });
    } catch (err) {
      if (err instanceof PhotoUploadError) {
        setError(err.message);
        return;
      }
      // El tope del plan también se aplica en las reglas de Firestore, así
      // que puede rebotar acá aunque la UI creyera que había cupo.
      setError(
        isPermissionDenied(err)
          ? `Llegaste al límite de ${cap} publicaciones activas. Archivá o marcá como vendida alguna para publicar otra.`
          : 'No pudimos publicar tu prenda. Intentá de nuevo.'
      );
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Publicar una prenda</Text>
        <Text style={styles.subtitle}>
          Te quedan {Math.max(cap - profile.activeListingCount, 0)} de {cap} publicaciones activas.
        </Text>

        {reachedCap ? (
          <View style={styles.capWarning}>
            <Text style={styles.capWarningTitle}>Llegaste al límite de tu plan</Text>
            <Text style={styles.capWarningText}>
              Tenés {cap} publicaciones activas
              {profile.isPro ? ' (plan PRO)' : ''}. Archivá o marcá como vendida alguna para liberar
              lugar{profile.isPro ? '.' : ', o pedí una cuenta PRO.'}
            </Text>
            <Button
              label="Ver mis publicaciones"
              variant="outline"
              small
              onPress={() => router.replace('/my-listings')}
            />
          </View>
        ) : null}

        <Text style={styles.label}>Fotos</Text>
        <PhotoPicker photos={photos} onChange={setPhotos} />

        <View style={styles.fieldsBlock}>
          <TextField
            label="Título"
            placeholder="Ej: Campera de jean talle M"
            value={title}
            onChangeText={setTitle}
            maxLength={MAX_LISTING_TITLE_LENGTH}
            showCounter
          />
          <TextField
            label="Descripción"
            placeholder="Contá el estado, la tela, cómo calza…"
            value={description}
            onChangeText={setDescription}
            maxLength={MAX_LISTING_DESCRIPTION_LENGTH}
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
          <TextField
            label="Precio"
            placeholder="Ej: 8000"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
            hint="Solo números, en pesos."
          />
        </View>

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

        <View style={styles.fieldsBlock}>
          <TextField label="Color" placeholder="Ej: Azul" value={color} onChangeText={setColor} />
          <TextField label="Ciudad" placeholder="Ej: Córdoba" value={city} onChangeText={setCity} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Publicar"
          onPress={handleSubmit}
          loading={createListing.isPending}
          disabled={reachedCap}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl + Spacing.xl,
  },
  title: {
    ...Typography.title,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.label,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  fieldsBlock: {
    marginTop: Spacing.xl,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  textarea: {
    height: 108,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  submitButton: {
    marginTop: Spacing.xl,
  },
  capWarning: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  capWarningTitle: {
    ...Typography.sectionTitle,
  },
  capWarningText: {
    ...Typography.caption,
    color: Colors.text,
  },
});
