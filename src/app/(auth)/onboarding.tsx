import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScaffold } from '@/components/AuthScaffold';
import { Button } from '@/components/Button';
import { InlineNotice } from '@/components/FormSection';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_USERNAME_LENGTH } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { signOut } from '@/features/auth/authApi';
import { createUserProfile, isUsernameTaken } from '@/features/users/usersApi';
import { useAuthStore } from '@/store/authStore';
import { isPermissionDenied } from '@/utils/errors';
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
    if (usernameError) return setError(usernameError);
    if (!displayName.trim()) return setError('Ingresá tu nombre.');
    if (!city.trim()) return setError('Ingresá tu ciudad.');

    setLoading(true);
    try {
      if (await isUsernameTaken(username)) {
        setError('Ese nombre de usuario ya está en uso.');
        setLoading(false);
        return;
      }
      const profile = await createUserProfile({ uid: firebaseUid, email, username, displayName, city });
      setProfile(profile);
    } catch (err) {
      console.warn('[Ronda] Error creando perfil', err);
      setError(
        isPermissionDenied(err)
          ? 'Ese nombre de usuario ya está en uso. Probá con otro.'
          : 'No pudimos crear tu perfil. Volvé a intentarlo.'
      );
      setLoading(false);
    }
  }

  return (
    <AuthScaffold
      eyebrow="PASO 2 DE 2"
      title="Hacé tu lugar en la ronda."
      subtitle="Estos datos aparecen en tu perfil y ayudan a descubrir prendas cerca."
    >
      <View style={styles.steps} accessibilityLabel="Paso 2 de 2">
        <View style={styles.stepActive} />
        <View style={styles.stepActive} />
      </View>

      <View style={styles.profileHint}>
        <View style={styles.avatarPreview}>
          <Ionicons name="person" size={24} color={Colors.plum} />
        </View>
        <View style={styles.profileHintText}>
          <Text style={styles.profileHintTitle}>Tu identidad en Ronda</Text>
          <Text style={styles.profileHintBody}>La foto es opcional; tus iniciales también quedan lindas.</Text>
        </View>
      </View>

      <TextField
        label="Nombre para mostrar"
        placeholder="Ej: Sofía Martínez"
        value={displayName}
        onChangeText={setDisplayName}
      />
      <TextField
        label="Nombre de usuario"
        placeholder="sofia.vintage"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={setUsername}
        maxLength={MAX_USERNAME_LENGTH}
        showCounter
        hint="Minúsculas, números, puntos y guiones bajos. Después queda fijo."
      />
      <TextField
        label="Ciudad"
        placeholder="Ej: Buenos Aires"
        value={city}
        onChangeText={setCity}
        hint="La mostramos para facilitar encuentros y envíos acordados por fuera."
      />
      {error ? <InlineNotice message={error} /> : null}
      <Button
        label="Empezar a descubrir"
        icon="sparkles"
        onPress={handleContinue}
        loading={loading}
        style={styles.button}
      />
      <Button label="Usar otra cuenta" variant="ghost" onPress={() => signOut()} style={styles.logout} small />
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  steps: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  stepActive: { flex: 1, height: 5, borderRadius: 999, backgroundColor: Colors.primary },
  profileHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.butterSoft,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.xl,
  },
  avatarPreview: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderStrong,
  },
  profileHintText: { flex: 1 },
  profileHintTitle: { ...Typography.label },
  profileHintBody: { ...Typography.caption },
  button: { marginTop: Spacing.lg },
  logout: { marginTop: Spacing.sm },
});
