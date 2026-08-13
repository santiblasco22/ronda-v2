import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import {
  FREE_ACCOUNT_LISTING_CAP,
  MAX_PRO_REQUEST_MESSAGE_LENGTH,
  PRO_ACCOUNT_LISTING_CAP,
} from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useCreateProRequest, useLatestProRequest } from '@/features/pro/useProRequest';

export default function ProRequestScreen() {
  const router = useRouter();
  const { data: latestRequest, isLoading } = useLatestProRequest();
  const createRequest = useCreateProRequest();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingView />;

  async function handleSubmit() {
    setError(null);
    if (!message.trim()) {
      setError('Contanos brevemente por qué querés una cuenta PRO.');
      return;
    }
    try {
      await createRequest.mutateAsync(message);
      router.back();
    } catch {
      setError('No pudimos enviar tu solicitud. Intentá de nuevo.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Cuenta PRO
        </Text>
        <Text style={styles.subtitle}>
          Las cuentas PRO pueden tener hasta {PRO_ACCOUNT_LISTING_CAP} publicaciones activas en vez
          de {FREE_ACCOUNT_LISTING_CAP}. Un moderador revisa cada solicitud a mano.
        </Text>

        {latestRequest?.status === 'pending' ? (
          <StatusBanner
            title="Tu solicitud está en revisión"
            body="Te vamos a avisar por notificación cuando la revisemos."
            color={Colors.gold}
          />
        ) : latestRequest?.status === 'approved' ? (
          <StatusBanner
            title="¡Ya tenés cuenta PRO!"
            body="Disfrutá de más publicaciones activas."
            color={Colors.successInk}
          />
        ) : (
          <>
            {latestRequest?.status === 'rejected' ? (
              <StatusBanner
                title="Tu última solicitud fue rechazada"
                body={latestRequest.reviewerNote || 'Podés volver a intentarlo con más detalles.'}
                color={Colors.dangerInk}
              />
            ) : null}
            <TextField
              label="Contanos sobre tu emprendimiento"
              placeholder="Ej: Vendo ropa vintage curada, subo prendas todas las semanas…"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              maxLength={MAX_PRO_REQUEST_MESSAGE_LENGTH}
              showCounter
              style={styles.textarea}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button
              label="Enviar solicitud"
              onPress={handleSubmit}
              loading={createRequest.isPending}
            />
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StatusBanner({ title, body, color }: { title: string; body: string; color: string }) {
  return (
    <View style={[styles.banner, { borderColor: color }]}>
      <Text style={[styles.bannerTitle, { color }]}>{title}</Text>
      <Text style={styles.bannerBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.title,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textMuted,
    marginBottom: Spacing.xl,
  },
  textarea: {
    height: 128,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  banner: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
    backgroundColor: Colors.surface,
  },
  bannerTitle: {
    ...Typography.sectionTitle,
  },
  bannerBody: {
    ...Typography.caption,
  },
});
