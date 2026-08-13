import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';
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
    if (emailError) {
      setError(emailError);
      return;
    }
    if (!password) {
      setError('Ingresá tu contraseña.');
      return;
    }
    setEmailLoading(true);
    try {
      await signInWithEmail(email, password);
      // El listener global de auth actualiza el store y redirige automáticamente.
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setEmailLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="shirt" size={38} color={Colors.textOnPrimary} />
          </View>
          <Text style={styles.appName} accessibilityRole="header">
            Ronda
          </Text>
          <Text style={styles.tagline}>Descubrí y dale una segunda vuelta a la ropa</Text>
        </View>

        <View style={styles.card}>
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
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Iniciar sesión" onPress={handleLogin} loading={emailLoading} disabled={googleLoading} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>o</Text>
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
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tenés cuenta?</Text>
          <Link href="/(auth)/register" style={styles.link}>
            Creá una
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxxl,
  },
  brand: {
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  logoCircle: {
    width: 76,
    height: 76,
    borderRadius: Radius.pill,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.floating,
  },
  appName: {
    ...Typography.display,
  },
  tagline: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    textAlign: 'center',
    maxWidth: 280,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    ...Shadows.card,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.micro,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xxl,
  },
  footerText: {
    ...Typography.caption,
  },
  link: {
    ...Typography.bodyStrong,
    fontSize: 14,
    color: Colors.primaryInk,
  },
});
