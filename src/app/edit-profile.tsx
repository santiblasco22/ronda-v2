import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/Button';
import { FormSection, InlineNotice } from '@/components/FormSection';
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
    if (status !== 'granted') return Alert.alert('Permiso necesario', 'Necesitamos acceso a tus fotos para continuar.');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(uid, result.assets[0]!.uri);
      if (url) setAvatarUrl(url);
    } catch (err) {
      Alert.alert('No pudimos subir la foto', err instanceof PhotoUploadError ? err.message : 'Intentá de nuevo en un rato.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setError(null);
    if (!displayName.trim()) return setError('Ingresá tu nombre.');
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>TU IDENTIDAD</Text>
          <Text style={styles.title}>Hacé que tu ropero se sienta tuyo.</Text>
          <Text style={styles.subtitle}>Una bio clara y una vía de contacto generan más confianza.</Text>
        </View>

        <FormSection icon="person-outline" title="Presentación" caption={`Tu usuario @${profile.username} no se puede cambiar`}>
          <View style={styles.avatarBlock}>
            <Avatar url={avatarUrl} name={displayName} size={96} />
            {photoUploadsEnabled ? (
              <Pressable onPress={handlePickAvatar} accessibilityRole="button" accessibilityLabel="Cambiar foto de perfil" style={styles.changePhoto} disabled={uploadingAvatar}>
                <Ionicons name="camera-outline" size={17} color={Colors.primaryInk} />
                <Text style={styles.changePhotoText}>{uploadingAvatar ? 'Subiendo…' : 'Cambiar foto'}</Text>
              </Pressable>
            ) : (
              <View style={styles.photoDisabled}>
                <Ionicons name="information-circle-outline" size={17} color={Colors.plum} />
                <Text style={styles.photoDisabledText}>Las fotos están desactivadas; mostramos tus iniciales.</Text>
              </View>
            )}
          </View>
          <TextField label="Nombre" value={displayName} onChangeText={setDisplayName} maxLength={MAX_DISPLAY_NAME_LENGTH} showCounter />
          <TextField label="Bio" placeholder="Contá qué estilo buscás o qué vendés" value={bio} onChangeText={setBio} maxLength={MAX_BIO_LENGTH} showCounter multiline numberOfLines={3} style={styles.textarea} />
          <TextField label="Ciudad" value={city} onChangeText={setCity} maxLength={MAX_CITY_LENGTH} showCounter />
        </FormSection>

        <FormSection icon="paper-plane-outline" title="Contacto" caption="Ronda no tiene chat: con una red activa alcanza">
          <TextField label="Instagram" placeholder="@tu.usuario" value={instagram} onChangeText={setInstagram} autoCapitalize="none" autoCorrect={false} />
          <TextField label="WhatsApp" placeholder="+54 9 11 1234 5678" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" />
          <TextField label="Facebook" placeholder="tu.usuario" value={facebook} onChangeText={setFacebook} autoCapitalize="none" autoCorrect={false} />
          <View style={styles.safetyNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color={Colors.successInk} />
            <Text style={styles.safetyText}>Solo se muestran en tu perfil y tus publicaciones.</Text>
          </View>
        </FormSection>

        {error ? <InlineNotice message={error} /> : null}
        <Button label="Guardar mi perfil" icon="checkmark" onPress={handleSave} loading={updateProfile.isPending} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { padding: Spacing.lg, paddingBottom: Spacing.jumbo, gap: Spacing.lg },
  intro: { paddingHorizontal: Spacing.xs, marginBottom: Spacing.xs },
  eyebrow: {
    ...Typography.micro,
    color: Colors.primaryInk,
    textTransform: 'uppercase',
  },
  title: { ...Typography.title, marginTop: Spacing.xs },
  subtitle: { ...Typography.body, color: Colors.textMuted, marginTop: Spacing.sm },
  avatarBlock: { alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  changePhoto: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.md },
  changePhotoText: { ...Typography.label, color: Colors.primaryInk },
  photoDisabled: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.butterSoft },
  photoDisabledText: { ...Typography.caption, color: Colors.plum, flex: 1 },
  textarea: { height: 96, textAlignVertical: 'top', paddingTop: Spacing.md },
  safetyNote: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.successSoft },
  safetyText: { ...Typography.caption, color: Colors.successInk, flex: 1, fontWeight: '600' },
});
