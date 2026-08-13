import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { Button } from '@/components/Button';
import { InlineNotice } from '@/components/FormSection';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';
import { mapAuthError, signUpWithEmail } from '@/features/auth/authApi';
import { validateEmail, validatePassword } from '@/utils/validators';

export default function RegisterScreen() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister() {
    setError(null);
    if (!displayName.trim()) return setError('Ingresá tu nombre.');
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);
    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
    } catch (err) {
      setError(mapAuthError(err));
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="PASO 1 DE 2"
      title="Abrí tu ropero a la comunidad."
      subtitle="Creá tu cuenta gratis. Después elegís cómo querés que te encuentren."
      showBack
    >
      <View style={styles.steps} accessibilityLabel="Paso 1 de 2">
        <View style={styles.stepActive} />
        <View style={styles.step} />
      </View>
      <Text style={styles.formTitle}>Tus datos de acceso</Text>
      <TextField
        label="Nombre"
        placeholder="Como te dicen"
        value={displayName}
        onChangeText={setDisplayName}
        autoComplete="name"
      />
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
        placeholder="Al menos 6 caracteres"
        secureTextEntry
        autoComplete="new-password"
        value={password}
        onChangeText={setPassword}
        hint="Usá 6 caracteres o más."
      />
      {error ? <InlineNotice message={error} /> : null}
      <Button
        label="Crear cuenta"
        icon="arrow-forward"
        onPress={handleRegister}
        loading={loading}
        style={styles.button}
      />
      <Text style={styles.terms}>Al continuar aceptás participar con respeto en la comunidad.</Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  step: { flex: 1, height: 5, borderRadius: 999, backgroundColor: Colors.surfaceMuted },
  stepActive: { flex: 1, height: 5, borderRadius: 999, backgroundColor: Colors.primary },
  formTitle: { ...Typography.heading, marginBottom: Spacing.xl },
  button: { marginTop: Spacing.lg },
  terms: { ...Typography.micro, textAlign: 'center', marginTop: Spacing.lg },
});
