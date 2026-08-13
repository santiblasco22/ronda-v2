import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { signOut } from '@/features/auth/authApi';
import { createUserProfile, isUsernameTaken } from '@/features/users/usersApi';
import { useAuthStore } from '@/store/authStore';
import { validateUsername } from '@/utils/validators';

export default function OnboardingScreen() {
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const email = useAuthStore((s) => s.email);
  const setProfile = useAuthStore((s) => s.setProfile);

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setError(null);
    if (!firebaseUid) return;

    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      return;
    }
    if (!displayName.trim()) {
      setError('Ingresá tu nombre.');
      return;
    }
    if (!city.trim()) {
      setError('Ingresá tu ciudad.');
      return;
    }

    setLoading(true);
    try {
      const taken = await isUsernameTaken(username);
      if (taken) {
        setError('Ese nombre de usuario ya está en uso.');
        setLoading(false);
        return;
      }
      const profile = await createUserProfile({
        uid: firebaseUid,
        email,
        username,
        displayName,
        city,
      });
      setProfile(profile);
      // El layout de (auth) detecta que ya hay perfil y redirige a las tabs.
    } catch (err) {
      console.warn('[Ronda] Error creando perfil', err);
      setError('No pudimos crear tu perfil. Volvé a intentarlo.');
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Contanos sobre vos</Text>
        <Text style={styles.subtitle}>Así te van a encontrar otros usuarios en Ronda.</Text>

        <TextField
          label="Nombre para mostrar"
          placeholder="Ej: Sofía Martínez"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <TextField
          label="Nombre de usuario"
          placeholder="ej: sofia.vintage"
          autoCapitalize="none"
          value={username}
          onChangeText={setUsername}
        />
        <TextField label="Ciudad" placeholder="Ej: Buenos Aires" value={city} onChangeText={setCity} />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Continuar" onPress={handleContinue} loading={loading} style={styles.button} />
        <Button
          label="Cerrar sesión"
          variant="ghost"
          onPress={() => signOut()}
          style={styles.button}
          small
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 48,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textMuted,
    marginBottom: 24,
  },
  button: {
    marginTop: 10,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
});
