import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { FREE_ACCOUNT_LISTING_CAP, PRO_ACCOUNT_LISTING_CAP } from '@/constants/limits';
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
        <Text style={styles.title}>Cuenta PRO</Text>
        <Text style={styles.subtitle}>
          Las cuentas PRO pueden tener hasta {PRO_ACCOUNT_LISTING_CAP} publicaciones activas en vez de{' '}
          {FREE_ACCOUNT_LISTING_CAP}. Un moderador revisa cada solicitud manualmente.
        </Text>

        {latestRequest?.status === 'pending' ? (
          <StatusBanner
            title="Tu solicitud está en revisión"
            body="Te vamos a avisar por notificación cuando la revisemos."
            color={Colors.gold}
          />
        ) : latestRequest?.status === 'approved' ? (
          <StatusBanner title="¡Ya tenés cuenta PRO!" body="Disfrutá de más publicaciones activas." color={Colors.accent} />
        ) : (
          <>
            {latestRequest?.status === 'rejected' ? (
              <StatusBanner
                title="Tu última solicitud fue rechazada"
                body={latestRequest.reviewerNote || 'Podés volver a intentarlo con más detalles.'}
                color={Colors.danger}
              />
            ) : null}
            <TextField
              label="Contanos sobre tu emprendimiento"
              placeholder="Ej: Vendo ropa vintage curada, subo prendas todas las semanas…"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              style={styles.textarea}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button label="Enviar solicitud" onPress={handleSubmit} loading={createRequest.isPending} />
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
    padding: 20,
    paddingBottom: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 20,
    lineHeight: 20,
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  banner: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  bannerTitle: {
    fontWeight: '700',
    fontSize: 14,
  },
  bannerBody: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
