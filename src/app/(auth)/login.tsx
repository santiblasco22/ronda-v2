import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { mapAuthError, signInWithEmail } from '@/features/auth/authApi';
import { useGoogleAuth } from '@/features/auth/useGoogleAuth';
import { validateEmail } from '@/utils/validators';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isConfigured, isReady, promptAsync } = useGoogleAuth(
    () => setLoading(false),
    (message) => {
      setLoading(false);
      setError(message);
    }
  );

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
    setLoading(true);
    try {
      await signInWithEmail(email, password);
      // El listener global de auth actualiza el store y redirige automáticamente.
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    if (!isConfigured) {
      Alert.alert(
        'Google no configurado',
        'Agregá las variables EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en tu archivo .env para habilitar el inicio de sesión con Google.'
      );
      return;
    }
    setLoading(true);
    await promptAsync();
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="shirt" size={36} color={Colors.white} />
          </View>
          <Text style={styles.appName}>Ronda</Text>
          <Text style={styles.tagline}>Descubrí y dale una segunda vuelta a la ropa</Text>
        </View>

        <TextField
          label="Email"
          placeholder="tu@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextField
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} style={styles.button} />

        <View style={styles.dividerRow}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.divider} />
        </View>

        <Button
          label="Continuar con Google"
          variant="outline"
          onPress={handleGoogle}
          loading={loading && isConfigured}
          disabled={!isReady && isConfigured}
          style={styles.button}
        />

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
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text,
  },
  tagline: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  button: {
    marginTop: 6,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 28,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  link: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
