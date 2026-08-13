import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { LoadingView } from '@/components/EmptyState';
import { FormSection, InlineNotice } from '@/components/FormSection';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { FREE_ACCOUNT_LISTING_CAP, MAX_PRO_REQUEST_MESSAGE_LENGTH, PRO_ACCOUNT_LISTING_CAP } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useCreateProRequest, useLatestProRequest } from '@/features/pro/useProRequest';

export default function ProRequestScreen() {
  const router = useRouter();
  const { data: latestRequest, isLoading } = useLatestProRequest();
  const createRequest = useCreateProRequest();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (isLoading) return <LoadingView label="Revisando tu solicitud…" />;

  async function handleSubmit() {
    setError(null);
    if (!message.trim()) return setError('Contanos brevemente por qué querés una cuenta PRO.');
    try {
      await createRequest.mutateAsync(message);
      router.back();
    } catch {
      setError('No pudimos enviar tu solicitud. Intentá de nuevo.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="sparkles" size={28} color={Colors.plum} /></View>
          <Text style={styles.eyebrow}>PARA EMPRENDIMIENTOS</Text>
          <Text style={styles.title}>Más lugar para hacer circular.</Text>
          <Text style={styles.subtitle}>Las cuentas PRO pasan de {FREE_ACCOUNT_LISTING_CAP} a {PRO_ACCOUNT_LISTING_CAP} prendas activas. No hay pagos en la app: cada solicitud se revisa a mano.</Text>
        </View>

        <View style={styles.benefits}>
          <Benefit icon="shirt-outline" title={`${PRO_ACCOUNT_LISTING_CAP} publicaciones`} body="Una vidriera más grande para tu catálogo." />
          <Benefit icon="ribbon-outline" title="Insignia PRO" body="Una señal clara en tu perfil y publicaciones." />
        </View>

        {latestRequest?.status === 'pending' ? (
          <StatusCard icon="time-outline" title="Tu solicitud está en revisión" body="Te vamos a avisar por notificación cuando tengamos una respuesta." tone="pending" />
        ) : latestRequest?.status === 'approved' ? (
          <StatusCard icon="checkmark-circle-outline" title="Tu cuenta ya es PRO" body="Ya podés disfrutar de más lugares en tu vidriera." tone="success" />
        ) : (
          <FormSection icon="document-text-outline" title="Tu solicitud" caption="Contanos qué vendés y con qué frecuencia publicás">
            {latestRequest?.status === 'rejected' ? (
              <InlineNotice message={latestRequest.reviewerNote || 'Tu solicitud anterior no fue aprobada. Podés volver a intentarlo con más detalles.'} />
            ) : null}
            <TextField
              label="Sobre tu emprendimiento"
              placeholder="Ej: Selecciono ropa vintage y sumo prendas todas las semanas…"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={5}
              maxLength={MAX_PRO_REQUEST_MESSAGE_LENGTH}
              showCounter
              style={styles.textarea}
            />
            {error ? <InlineNotice message={error} /> : null}
            <Button label="Enviar solicitud" icon="paper-plane-outline" onPress={handleSubmit} loading={createRequest.isPending} />
          </FormSection>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Benefit({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return <View style={styles.benefit}><View style={styles.benefitIcon}><Ionicons name={icon} size={20} color={Colors.primaryInk} /></View><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitBody}>{body}</Text></View>;
}

function StatusCard({ icon, title, body, tone }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; tone: 'pending' | 'success' }) {
  const background = tone === 'success' ? Colors.successSoft : Colors.butterSoft;
  const color = tone === 'success' ? Colors.successInk : Colors.plum;
  return <View style={[styles.statusCard, { backgroundColor: background }]}><Ionicons name={icon} size={28} color={color} /><Text style={[styles.statusTitle, { color }]}>{title}</Text><Text style={styles.statusBody}>{body}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.jumbo, gap: Spacing.lg },
  hero: { alignItems: 'center', paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm },
  heroIcon: { width: 64, height: 64, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.butter, borderWidth: 1.5, borderColor: Colors.text, transform: [{ rotate: '-4deg' }], marginBottom: Spacing.lg },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  title: { ...Typography.title, textAlign: 'center', marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
  benefits: { flexDirection: 'row', gap: Spacing.md },
  benefit: { flex: 1, padding: Spacing.lg, borderRadius: Radius.xl, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm },
  benefitIcon: { width: 38, height: 38, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primarySoft },
  benefitTitle: { ...Typography.label },
  benefitBody: { ...Typography.caption },
  textarea: { height: 132, textAlignVertical: 'top', paddingTop: Spacing.md },
  statusCard: { alignItems: 'center', borderRadius: Radius.xl, padding: Spacing.xxl, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.borderStrong },
  statusTitle: { ...Typography.heading, textAlign: 'center' },
  statusBody: { ...Typography.body, textAlign: 'center', color: Colors.textMuted },
});
