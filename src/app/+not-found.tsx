import { useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';

export default function NotFoundScreen() {
  const router = useRouter();

  return (
    <Screen>
      <EmptyState
        icon="compass-outline"
        title="Esta pantalla no existe"
        subtitle="El enlace que abriste no lleva a ninguna parte de Ronda."
        actionLabel="Ir a Descubrir"
        onAction={() => router.replace('/(tabs)')}
      />
    </Screen>
  );
}
