import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useEffect } from 'react';

import { signInWithGoogleIdToken } from './authApi';

/**
 * Si no hay ningún client ID de Google, `Google.useIdTokenAuthRequest` lanza
 * al renderizar ("Client Id property must be defined…") y deja la pantalla de
 * login en blanco. Como el valor sale de variables de entorno, es constante
 * durante toda la vida de la app: alcanza con no montar el componente que usa
 * el hook (ver `GoogleSignInButton`), sin romper el orden de hooks.
 */
export const isGoogleAuthConfigured = Boolean(
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
);

/**
 * Hook de inicio de sesión con Google vía expo-auth-session (compatible con
 * Expo Go, sin necesidad de módulos nativos). Solo se puede usar cuando
 * `isGoogleAuthConfigured` es true.
 */
export function useGoogleAuth(
  onSuccess: () => void,
  onError: (message: string) => void,
  onCancel?: () => void
) {
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: AuthSession.makeRedirectUri({ scheme: 'ronda' }),
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token ?? response.authentication?.idToken;
      if (!idToken) {
        onError('No se pudo obtener la credencial de Google.');
        return;
      }
      signInWithGoogleIdToken(idToken)
        .then(onSuccess)
        .catch(() => {
          onError('No se pudo iniciar sesión con Google.');
        });
    } else if (response?.type === 'error') {
      onError('No se pudo iniciar sesión con Google.');
    } else if (response?.type === 'cancel' || response?.type === 'dismiss') {
      // El usuario cerró la hoja de Google a propósito: no es un error.
      onCancel?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response]);

  return {
    isReady: Boolean(request),
    promptAsync,
  };
}
