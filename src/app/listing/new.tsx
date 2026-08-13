import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormSection, InlineNotice } from '@/components/FormSection';
import { PhotoPicker, type PickedPhoto } from '@/components/PhotoPicker';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { getListingCapFor, MAX_LISTING_DESCRIPTION_LENGTH, MAX_LISTING_TITLE_LENGTH } from '@/constants/limits';
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
  const available = Math.max(cap - profile.activeListingCount, 0);

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
        localPhotoUris: photos.map((photo) => photo.uri),
      });
      router.replace({ pathname: '/listing/[id]', params: { id } });
    } catch (err) {
      if (err instanceof PhotoUploadError) return setError(err.message);
      setError(
        isPermissionDenied(err)
          ? `Llegaste al límite de ${cap} publicaciones activas. Archivá o marcá como vendida alguna para publicar otra.`
          : 'No pudimos publicar tu prenda. Intentá de nuevo.'
      );
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>NUEVA PUBLICACIÓN</Text>
          <Text style={styles.title}>Poné una prenda en ronda.</Text>
          <Text style={styles.subtitle}>Con los datos básicos alcanza. La foto y la descripción son opcionales.</Text>
          <View style={styles.quotaPill}>
            <Ionicons name="layers-outline" size={15} color={Colors.plum} />
            <Text style={styles.quotaText}>{available} de {cap} lugares disponibles</Text>
          </View>
        </View>

        {reachedCap ? (
          <FormSection icon="lock-closed-outline" title="Tu vidriera está completa" caption={`Ya tenés ${cap} publicaciones activas.`}>
            <Text style={styles.capText}>Archivá o marcá una prenda como vendida para liberar lugar{profile.isPro ? '.' : ', o solicitá una cuenta PRO.'}</Text>
            <Button label="Gestionar mis prendas" variant="outline" small onPress={() => router.replace('/my-listings')} />
          </FormSection>
        ) : null}

        <FormSection icon="camera-outline" title="Fotos" caption="Opcionales · la primera funciona como portada">
          <PhotoPicker photos={photos} onChange={setPhotos} />
        </FormSection>

        <FormSection icon="pricetag-outline" title="Lo esencial" caption="Que se entienda rápido qué ofrecés">
          <TextField label="Título" placeholder="Ej: Campera de jean oversized" value={title} onChangeText={setTitle} maxLength={MAX_LISTING_TITLE_LENGTH} showCounter />
          <TextField label="Precio en pesos" placeholder="Ej: 8000" keyboardType="numeric" value={price} onChangeText={setPrice} hint="Ingresá solo números." />
          <TextField
            label="Descripción (opcional)"
            placeholder="Contá sobre la tela, cómo calza o cualquier detalle…"
            value={description}
            onChangeText={setDescription}
            maxLength={MAX_LISTING_DESCRIPTION_LENGTH}
            showCounter
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </FormSection>

        <FormSection icon="options-outline" title="Cómo es" caption="Estos datos ayudan a encontrarla">
          <ChoiceGroup label="Categoría">
            {LISTING_CATEGORIES.map((item) => <Chip key={item} label={item} selected={category === item} onPress={() => setCategory(item)} />)}
          </ChoiceGroup>
          <ChoiceGroup label="Talle">
            {LISTING_SIZES.map((item) => <Chip key={item} label={item} selected={size === item} onPress={() => setSize(item)} />)}
          </ChoiceGroup>
          <ChoiceGroup label="Estado de la prenda">
            {LISTING_CONDITIONS.map((item) => <Chip key={item} label={item} selected={condition === item} onPress={() => setCondition(item)} />)}
          </ChoiceGroup>
        </FormSection>

        <FormSection icon="location-outline" title="Detalles" caption="Opcionales, pero suman contexto">
          <TextField label="Color" placeholder="Ej: Azul lavado" value={color} onChangeText={setColor} />
          <TextField label="Ciudad" placeholder="Ej: Córdoba" value={city} onChangeText={setCity} />
        </FormSection>

        {error ? <InlineNotice message={error} /> : null}
        <Button label="Publicar en Ronda" icon="sparkles" onPress={handleSubmit} loading={createListing.isPending} disabled={reachedCap} style={styles.submitButton} />
        <Text style={styles.footnote}>Podés editar la publicación o cambiar su estado cuando quieras.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.choiceGroup}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.chipsRow}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.jumbo, gap: Spacing.lg },
  intro: { paddingHorizontal: Spacing.xs, marginBottom: Spacing.xs },
  eyebrow: { ...Typography.micro, color: Colors.primaryInk },
  title: { ...Typography.title, marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  quotaPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.lg, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: Radius.pill, backgroundColor: Colors.butterSoft },
  quotaText: { ...Typography.caption, color: Colors.plum, fontWeight: '700' },
  capText: { ...Typography.body, color: Colors.textMuted },
  textarea: { height: 112, textAlignVertical: 'top', paddingTop: Spacing.md },
  choiceGroup: { gap: Spacing.sm },
  choiceLabel: { ...Typography.label },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  submitButton: { marginTop: Spacing.sm },
  footnote: { ...Typography.micro, textAlign: 'center' },
});
