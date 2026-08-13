import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
import { RatingStarsInput } from '@/components/RatingStars';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_RATING_COMMENT_LENGTH } from '@/constants/limits';
import { useCreateRating, useHasRated } from '@/features/ratings/useRatings';
import { useUserProfile } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

export default function RateUserScreen() {
  const params = useLocalSearchParams<{ userId: string; listingId?: string; listingTitle?: string }>();
  const router = useRouter();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: ratedUser, isLoading } = useUserProfile(params.userId);
  const listingId = params.listingId?.trim() || null;
  const { data: alreadyRated } = useHasRated(params.userId, listingId);
  const createRating = useCreateRating();

  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !ratedUser) return <LoadingView />;

  if (myUid === params.userId) {
    return (
      <ScrollWrapper>
        <Text style={styles.title}>No podés calificarte a vos mismo.</Text>
      </ScrollWrapper>
    );
  }

  if (alreadyRated) {
    return (
      <ScrollWrapper>
        <Text style={styles.title}>Ya calificaste a {ratedUser.displayName}.</Text>
        <Text style={styles.subtitle}>¡Gracias por ayudar a la comunidad de Ronda!</Text>
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
    } catch {
      setError('No pudimos enviar tu calificación.');
    }
  }

  return (
    <ScrollWrapper>
      <Text style={styles.title}>Calificar a {ratedUser.displayName}</Text>
      {params.listingTitle ? (
        <Text style={styles.subtitle}>Sobre &ldquo;{params.listingTitle}&rdquo;</Text>
      ) : null}

      <RatingStarsInput value={stars} onChange={setStars} />

      <TextField
        label="Comentario (opcional)"
        placeholder="¿Cómo fue tu experiencia?"
        value={comment}
        onChangeText={setComment}
        maxLength={MAX_RATING_COMMENT_LENGTH}
        multiline
        numberOfLines={4}
        style={styles.textarea}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="Enviar calificación" onPress={handleSubmit} loading={createRating.isPending} />
    </ScrollWrapper>
  );
}

function ScrollWrapper({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>{children}</ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  textarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
  },
});
