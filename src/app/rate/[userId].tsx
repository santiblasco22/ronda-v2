import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { EmptyState, LoadingView } from '@/components/EmptyState';
import { FormSection, InlineNotice } from '@/components/FormSection';
import { RatingStarsInput } from '@/components/RatingStars';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_RATING_COMMENT_LENGTH } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useCreateRating, useHasRated } from '@/features/ratings/useRatings';
import { useUserProfile } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';
import { isPermissionDenied } from '@/utils/errors';

const STAR_LABELS = ['', 'Mala', 'Regular', 'Buena', 'Muy buena', 'Excelente'];

export default function RateUserScreen() {
  const params = useLocalSearchParams<{ userId: string; listingId?: string; listingTitle?: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: ratedUser, isLoading } = useUserProfile(params.userId);
  const listingId = params.listingId?.trim() || null;
  const { data: alreadyRated } = useHasRated(params.userId);
  const createRating = useCreateRating();
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !ratedUser) return <LoadingView label="Preparando la opinión…" />;
  if (myUid === params.userId) return <State title="Tu propio ropero no necesita calificación" subtitle="Las opiniones las dejan otras personas de la comunidad." onBack={() => router.back()} />;
  if (alreadyRated) return <State title={`Ya calificaste a ${ratedUser.displayName}`} subtitle="Cada cuenta puede dejar una sola opinión por vendedor. Gracias por aportar confianza a la ronda." onBack={() => router.back()} />;
  const ratedUserId = ratedUser.uid;

  async function handleSubmit() {
    setError(null);
    try {
      await createRating.mutateAsync({ ratedUserId, listingId, listingTitle: params.listingTitle?.trim() || null, stars, comment });
      router.back();
    } catch (err) {
      setError(isPermissionDenied(err) ? 'Ya calificaste a esta persona: cada cuenta puede dejar una sola opinión.' : 'No pudimos enviar tu calificación.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatarWrap}><Avatar url={ratedUser.avatarUrl} name={ratedUser.displayName} size={72} /></View>
          <Text style={styles.eyebrow}>TU EXPERIENCIA CUENTA</Text>
          <Text style={styles.title}>¿Cómo fue con {ratedUser.displayName}?</Text>
          {params.listingTitle ? <Text style={styles.subtitle}>Sobre “{params.listingTitle}”</Text> : <Text style={styles.subtitle}>Tu opinión ayuda a comprar y vender con más confianza.</Text>}
        </View>

        <FormSection icon="star-outline" title="Tu calificación">
          <View style={styles.starsBlock}>
            <RatingStarsInput value={stars} onChange={setStars} />
            <View style={styles.starsLabelPill}><Text style={styles.starsLabel}>{STAR_LABELS[stars]}</Text></View>
          </View>
          <TextField label="Comentario (opcional)" placeholder="¿Cómo fue la comunicación? ¿La prenda era como esperabas?" value={comment} onChangeText={setComment} maxLength={MAX_RATING_COMMENT_LENGTH} showCounter multiline numberOfLines={4} style={styles.textarea} />
          {error ? <InlineNotice message={error} /> : null}
          <Button label="Publicar opinión" icon="checkmark" onPress={handleSubmit} loading={createRating.isPending} />
        </FormSection>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
          <Text style={styles.disclaimerText}>Las opiniones son públicas y no se pueden editar ni borrar.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function State({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  return <View style={styles.flex}><EmptyState icon="star-outline" title={title} subtitle={subtitle} actionLabel="Volver" onAction={onBack} /></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.jumbo, gap: Spacing.lg },
  hero: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  avatarWrap: { padding: 4, borderRadius: Radius.pill, backgroundColor: Colors.butter, marginBottom: Spacing.lg, transform: [{ rotate: '-3deg' }] },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  title: { ...Typography.title, fontSize: 25, textAlign: 'center', marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  starsBlock: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.md },
  starsLabelPill: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: Radius.pill, backgroundColor: Colors.butterSoft },
  starsLabel: { ...Typography.label, color: Colors.plum },
  textarea: { height: 112, textAlignVertical: 'top', paddingTop: Spacing.md },
  disclaimer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md },
  disclaimerText: { ...Typography.micro, flex: 1 },
});
