import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { Button } from '@/components/Button';
import { InlineNotice } from '@/components/FormSection';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';
import { mapAuthError, signInWithEmail } from '@/features/auth/authApi';
import { validateEmail } from '@/utils/validators';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setError(null);
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    if (!password) return setError('Ingresá tu contraseña.');
    setEmailLoading(true);
    try {
      await signInWithEmail(email, password);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="ROPA CON OTRA HISTORIA"
      title="Tu próxima favorita ya está dando vueltas."
      subtitle="Descubrí prendas cerca tuyo, seguí roperos con onda y dales una segunda vida."
      showMotif
      footer={
        <View style={styles.signupRow}>
          <Text style={styles.footerText}>¿Primera vez por acá?</Text>
          <Link href="/(auth)/register" asChild>
            <Pressable accessibilityRole="button" style={styles.signupButton}>
              <Text style={styles.link}>Crear mi cuenta</Text>
            </Pressable>
          </Link>
        </View>
      }
    >
      <Text style={styles.formEyebrow}>VOLVÉ A TU RONDA</Text>
      <Text style={styles.formTitle}>Ingresá a tu cuenta</Text>
      <View style={styles.fields}>
        <TextField
          label="Email"
          placeholder="tu@email.com"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
          value={password}
          onChangeText={setPassword}
        />
      </View>
      {error ? <InlineNotice message={error} /> : null}
      <Button
        label="Entrar a Ronda"
        icon="arrow-forward"
        onPress={handleLogin}
        loading={emailLoading}
        disabled={googleLoading}
        style={styles.primary}
      />

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>O SEGUÍ CON</Text>
        <View style={styles.divider} />
      </View>

      <GoogleSignInButton
        loading={googleLoading}
        disabled={emailLoading}
        onStart={() => {
          setError(null);
          setGoogleLoading(true);
        }}
        onSuccess={() => setGoogleLoading(false)}
        onCancel={() => setGoogleLoading(false)}
        onError={(message) => {
          setGoogleLoading(false);
          setError(message);
        }}
      />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  formEyebrow: { ...Typography.micro, color: Colors.primaryInk },
  formTitle: { ...Typography.heading, marginTop: Spacing.xs, marginBottom: Spacing.xl },
  fields: { marginBottom: -Spacing.sm },
  primary: { marginTop: Spacing.lg },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginVertical: Spacing.lg },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { ...Typography.micro, fontSize: 10 },
  signupRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' },
  footerText: { ...Typography.caption },
  signupButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.sm },
  link: { ...Typography.bodyStrong, color: Colors.primaryInk },
});
