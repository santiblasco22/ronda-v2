import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';

import { signInWithGoogleIdToken } from './authApi';

/**
 * Hook de inicio de sesión con Google vía expo-auth-session (compatible con
 * Expo Go, sin necesidad de módulos nativos). Requiere configurar los
 * EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en .env (ver .env.example).
 */
export function useGoogleAuth(onSuccess: () => void, onError: (message: string) => void) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'ronda' }),
  });

  const isConfigured = Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        onError('No se pudo obtener la credencial de Google.');
        return;
      }
      signInWithGoogleIdToken(idToken).then(onSuccess).catch(() => {
        onError('No se pudo iniciar sesión con Google.');
      });
    } else if (response?.type === 'error') {
      onError('No se pudo iniciar sesión con Google.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    isConfigured,
    isReady: Boolean(request),
    promptAsync,
  };
}
