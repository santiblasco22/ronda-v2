import { Alert } from 'react-native';

import { isGoogleAuthConfigured, useGoogleAuth } from '@/features/auth/useGoogleAuth';

import { Button } from './Button';

/**
 * Botón "Continuar con Google".
 *
 * El hook de expo-auth-session solo se monta cuando hay client IDs
 * configurados: sin ellos lanza al renderizar y dejaba la pantalla de login en
 * blanco en una instalación recién clonada. Cuando falta la configuración se
 * muestra el mismo botón, pero explicando qué falta al tocarlo.
 */
export function GoogleSignInButton({
  onStart,
  onSuccess,
  onError,
  onCancel,
  loading,
  disabled,
}: {
  onStart: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel?: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  if (!isGoogleAuthConfigured) {
    return <UnconfiguredGoogleButton disabled={disabled} />;
  }
  return (
    <ConfiguredGoogleButton
      onStart={onStart}
      onSuccess={onSuccess}
      onError={onError}
      onCancel={onCancel}
      loading={loading}
      disabled={disabled}
    />
  );
}

function UnconfiguredGoogleButton({ disabled }: { disabled?: boolean }) {
  return (
    <Button
      label="Continuar con Google"
      variant="outline"
      icon="logo-google"
      disabled={disabled}
      onPress={() =>
        Alert.alert(
          'Google no configurado',
          'Agregá las variables EXPO_PUBLIC_GOOGLE_*_CLIENT_ID en tu archivo .env para habilitar el inicio de sesión con Google.'
        )
      }
    />
  );
}

function ConfiguredGoogleButton({
  onStart,
  onSuccess,
  onError,
  onCancel,
  loading,
  disabled,
}: {
  onStart: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel?: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  const { isReady, promptAsync } = useGoogleAuth(onSuccess, onError, onCancel);

  return (
    <Button
      label="Continuar con Google"
      variant="outline"
      icon="logo-google"
      loading={loading}
      disabled={disabled || !isReady}
      onPress={() => {
        onStart();
        void promptAsync();
      }}
    />
  );
}
