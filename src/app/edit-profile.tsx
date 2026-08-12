import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Colors } from '@/constants/colors';
import { MAX_BIO_LENGTH } from '@/constants/limits';
import { useUpdateProfile } from '@/features/users/useUserProfile';
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
      setAvatarUrl(url);
    } catch {
      Alert.alert('Error', 'No pudimos subir la foto. Intentá de nuevo.');
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
        <Pressable style={styles.avatarWrapper} onPress={handlePickAvatar}>
          <Avatar url={avatarUrl} name={displayName} size={96} />
          <Text style={styles.avatarHint}>
            {uploadingAvatar ? 'Subiendo…' : 'Cambiar foto de perfil'}
          </Text>
        </Pressable>

        <TextField label="Nombre" value={displayName} onChangeText={setDisplayName} />
        <TextField
          label="Bio"
          placeholder="Contá algo sobre vos y lo que vendés"
          value={bio}
          onChangeText={setBio}
          maxLength={MAX_BIO_LENGTH}
          multiline
          numberOfLines={3}
          style={styles.textarea}
        />
        <TextField label="Ciudad" value={city} onChangeText={setCity} />

        <Text style={styles.sectionLabel}>Redes para que te contacten</Text>
        <TextField label="Instagram" placeholder="@tu.usuario" value={instagram} onChangeText={setInstagram} autoCapitalize="none" />
        <TextField
          label="WhatsApp"
          placeholder="+54 9 11 1234 5678"
          value={whatsapp}
          onChangeText={setWhatsapp}
          keyboardType="phone-pad"
        />
        <TextField label="Facebook" placeholder="tu.usuario" value={facebook} onChangeText={setFacebook} autoCapitalize="none" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Guardar" onPress={handleSave} loading={updateProfile.isPending} style={styles.saveButton} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: {
    padding: 20,
    paddingBottom: 60,
  },
  avatarWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  avatarHint: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginTop: 12,
    marginBottom: 6,
  },
  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: 10,
  },
  saveButton: {
    marginTop: 12,
  },
});
