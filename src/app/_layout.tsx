import { QueryClientProvider } from '@tanstack/react-query';
import { Redirect, Stack, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LoadingView } from '@/components/EmptyState';
import { Colors } from '@/constants/colors';
import { useAuthListener } from '@/features/auth/useAuthListener';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthGate />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Puerta de autenticación de toda la app. Vive en la raíz (y no solo en el
 * layout de tabs) porque las pantallas sueltas —listing/new, edit-profile,
 * rate/[userId], user/[id]…— son hermanas de (tabs): sin este control se
 * podían abrir por deep link sin sesión y quedaban en blanco o rompían al
 * leer el perfil.
 */
function AuthGate() {
  useAuthListener();
  const initializing = useAuthStore((s) => s.initializing);
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const profile = useAuthStore((s) => s.profile);
  const segments = useSegments();

  const inAuthFlow = segments[0] === '(auth)';

  if (initializing) {
    return <LoadingView />;
  }
  if (!firebaseUid && !inAuthFlow) {
    return <Redirect href="/(auth)/login" />;
  }
  if (firebaseUid && !profile && !inAuthFlow) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.plum,
        headerTitleStyle: { fontWeight: '800', color: Colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="listing/[id]" options={{ title: 'Publicación', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="listing/new" options={{ title: 'Nueva publicación', presentation: 'modal' }} />
      <Stack.Screen name="listing/edit/[id]" options={{ title: 'Editar publicación', presentation: 'modal' }} />
      <Stack.Screen name="user/[id]" options={{ title: 'Perfil', headerBackTitle: 'Atrás' }} />
      <Stack.Screen name="my-listings" options={{ title: 'Mis publicaciones' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Editar perfil', presentation: 'modal' }} />
      <Stack.Screen name="pro-request" options={{ title: 'Cuenta PRO', presentation: 'modal' }} />
      <Stack.Screen name="rate/[userId]" options={{ title: 'Calificar', presentation: 'modal' }} />
      <Stack.Screen name="followers/[id]" options={{ title: 'Seguidores' }} />
      <Stack.Screen name="following/[id]" options={{ title: 'Siguiendo' }} />
      <Stack.Screen name="+not-found" options={{ title: 'No encontrado' }} />
    </Stack>
  );
}
