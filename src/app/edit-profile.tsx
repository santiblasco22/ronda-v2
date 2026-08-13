import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_BIO_LENGTH, MAX_CITY_LENGTH, MAX_DISPLAY_NAME_LENGTH } from '@/constants/limits';
import { Radius, Spacing, Typography } from '@/constants/theme';
import { useUpdateProfile } from '@/features/users/useUserProfile';
import { PhotoUploadError, photoUploadsEnabled } from '@/lib/photoUploads';
import { uploadAvatar } from '@/lib/upload';
import { useAuthStore } from '@/store/authStore';

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const updateProfile = useUpdateProfile();

  const [displayName, setDisplayName] = useState(profile?.displayName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [instagram, setInstagram] = useState(profile?.socialLinks.instagram ?? '');
  const [whatsapp, setWhatsapp] = useState(profile?.socialLinks.whatsapp ?? '');
  const [facebook, setFacebook] = useState(profile?.socialLinks.facebook ?? '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl ?? null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  const uid = profile.uid;

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(uid, result.assets[0]!.uri);
      if (url) setAvatarUrl(url);
    } catch (err) {
      Alert.alert(
        'No pudimos subir la foto',
        err instanceof PhotoUploadError ? err.message : 'Intentá de nuevo en un rato.'
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setError(null);
    if (!displayName.trim()) {
      setError('Ingresá tu nombre.');
      return;
    }
    try {
      await updateProfile.mutateAsync({
        displayName,
        bio,
        city,
        avatarUrl,
        socialLinks: {
          instagram: instagram.trim() || undefined,
          whatsapp: whatsapp.trim() || undefined,
          facebook: facebook.trim() || undefined,
        },
      });
      router.back();
    } catch {
      setError('No pudimos guardar los cambios.');
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarBlock}>
          {photoUploadsEnabled ? (
            <Pressable
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
            >
              <Avatar url={avatarUrl} name={displayName} size={96} />
              <Text style={styles.avatarHint}>
                {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto de perfil'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.avatarWrapper}>
              <Avatar url={avatarUrl} name={displayName} size={96} />
              <Text style={styles.avatarDisabledHint}>
                Las fotos de perfil están desactivadas en esta instalación. Mostramos tus iniciales.
              </Text>
            </View>
          )}
        </View>

        <TextField
          label="Nombre"
          value={displayName}
          onChangeText={setDisplayName}
          maxLength={MAX_DISPLAY_NAME_LENGTH}
        />
        <TextField
          label="Bio"
          placeholder="Contá algo sobre vos y lo que vendés"
          value={bio}
          onChangeText={setBio}
          maxLength={MAX_BIO_LENGTH}
          showCounter
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />
        <TextField label="Ciudad" value={city} onChangeText={setCity} maxLength={MAX_CITY_LENGTH} />

        <Text style={styles.sectionLabel}>Redes para que te contacten</Text>
        <Text style={styles.sectionHint}>
          Ronda no tiene chat: el comprador te escribe por acá. Con una alcanza.
        </Text>
        <TextField
          label="Instagram"
          placeholder="@tu.usuario"
          value={instagram}
          onChangeText={setInstagram}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextField
          label="WhatsApp"
          placeholder="+54 9 11 1234 5678"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
        <TextField
          label="Facebook"
          placeholder="tu.usuario"
          value={facebook}
          onChangeText={setFacebook}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Guardar cambios"
          onPress={handleSave}
          loading={updateProfile.isPending}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
  },
  avatarBlock: {
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatarHint: {
    ...Typography.caption,
    color: Colors.primaryInk,
    fontWeight: '700',
  },
  avatarDisabledHint: {
    ...Typography.micro,
    textAlign: 'center',
    maxWidth: 260,
  },
  textarea: {
    height: 88,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    ...Typography.sectionTitle,
    marginTop: Spacing.md,
  },
  sectionHint: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    backgroundColor: Colors.dangerSoft,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.md,
  },
});
