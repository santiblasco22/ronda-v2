import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
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
  // Una calificación por persona: si ya calificó a este vendedor (desde
  // cualquier publicación), no puede volver a hacerlo.
  const { data: alreadyRated } = useHasRated(params.userId);
  const createRating = useCreateRating();

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !ratedUser) return <LoadingView />;

  if (myUid === params.userId) {
    return (
      <ScrollWrapper>
        <Text style={styles.title}>No podés calificarte a vos mismo.</Text>
        <Button label="Volver" variant="outline" onPress={() => router.back()} />
      </ScrollWrapper>
    );
  }

  if (alreadyRated) {
    return (
      <ScrollWrapper>
        <Text style={styles.title}>Ya calificaste a {ratedUser.displayName}.</Text>
        <Text style={styles.subtitle}>
          Cada cuenta puede dejar una sola calificación por vendedor. ¡Gracias por ayudar a la
          comunidad de Ronda!
        </Text>
        <Button label="Volver" variant="outline" onPress={() => router.back()} />
      </ScrollWrapper>
    );
  }

  const ratedUserId = ratedUser.uid;

  async function handleSubmit() {
    setError(null);
    try {
      await createRating.mutateAsync({
        ratedUserId,
        listingId,
        listingTitle: params.listingTitle?.trim() || null,
        stars,
        comment,
      });
      router.back();
    } catch (err) {
      setError(
        isPermissionDenied(err)
          ? 'Ya calificaste a esta persona: cada cuenta puede dejar una sola calificación.'
          : 'No pudimos enviar tu calificación.'
      );
    }
  }

  return (
    <ScrollWrapper>
      <View style={styles.header}>
        <Avatar url={ratedUser.avatarUrl} name={ratedUser.displayName} size={56} />
        <View style={styles.headerText}>
          <Text style={styles.title}>Calificar a {ratedUser.displayName}</Text>
          {params.listingTitle ? (
            <Text style={styles.subtitle}>Sobre &ldquo;{params.listingTitle}&rdquo;</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.starsCard}>
        <RatingStarsInput value={stars} onChange={setStars} />
        <Text style={styles.starsLabel}>{STAR_LABELS[stars]}</Text>
      </View>

      <TextField
        label="Comentario (opcional)"
        placeholder="¿Cómo fue tu experiencia? ¿La prenda era como en la foto?"
        value={comment}
        onChangeText={setComment}
        maxLength={MAX_RATING_COMMENT_LENGTH}
        showCounter
        multiline
        numberOfLines={4}
        style={styles.textarea}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Enviar calificación" onPress={handleSubmit} loading={createRating.isPending} />
      <Text style={styles.disclaimer}>
        Las calificaciones son públicas y no se pueden editar ni borrar.
      </Text>
    </ScrollWrapper>
  );
}

function ScrollWrapper({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    ...Typography.heading,
  },
  subtitle: {
    ...Typography.caption,
  },
  starsCard: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starsLabel: {
    ...Typography.label,
    color: Colors.primaryInk,
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
  },
  disclaimer: {
    ...Typography.micro,
    textAlign: 'center',
  },
});
