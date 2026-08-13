import { Redirect, Stack } from 'expo-router';

import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const firebaseUid = useAuthStore((s) => s.firebaseUid);
  const profile = useAuthStore((s) => s.profile);

  if (firebaseUid && profile) {
    return <Redirect href="/(tabs)" />;
  }
  if (firebaseUid && !profile) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack
      initialRouteName="login"
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
    </Stack>
  );
}
