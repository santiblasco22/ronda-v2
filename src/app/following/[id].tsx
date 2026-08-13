import { useLocalSearchParams } from 'expo-router';

import { UserList } from '@/components/UserList';
import { useFollowing } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

export default function FollowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: following, isLoading, isError, refetch } = useFollowing(id);
  const isMe = myUid === id;

  return (
    <UserList
      users={following}
      isLoading={isLoading}
      isError={isError}
      onRetry={() => refetch()}
      emptyTitle={isMe ? 'Todavía no seguís a nadie' : 'Todavía no sigue a nadie'}
      emptySubtitle={
        isMe
          ? 'Seguí vendedores desde Descubrir o Buscar para ver sus prendas nuevas en la pestaña Siguiendo.'
          : undefined
      }
    />
  );
}
