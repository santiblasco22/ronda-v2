import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { Radius, Spacing, Typography } from '@/constants/theme';
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
    if (!displayName.trim()) {
      setError('Ingresá tu nombre.');
      return;
    }
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    setLoading(true);
    try {
      await signUpWithEmail(email, password, displayName);
      // El listener global detecta que falta el perfil y redirige a onboarding.
    } catch (err) {
      setError(mapAuthError(err));
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title} accessibilityRole="header">
          Creá tu cuenta
        </Text>
        <Text style={styles.subtitle}>Es gratis y te lleva un minuto.</Text>

        <TextField
          label="Nombre"
          placeholder="Tu nombre"
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
          hint="Mínimo 6 caracteres."
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Crear cuenta" onPress={handleRegister} loading={loading} style={styles.button} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  title: {
    ...Typography.display,
    fontSize: 26,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.caption,
    marginBottom: Spacing.xxl,
  },
  button: {
    marginTop: Spacing.md,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
});
