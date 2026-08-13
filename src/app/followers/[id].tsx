import { useLocalSearchParams } from 'expo-router';

import { UserList } from '@/components/UserList';
import { useFollowers } from '@/features/users/useUserProfile';
import { useAuthStore } from '@/store/authStore';

export default function FollowersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const myUid = useAuthStore((s) => s.firebaseUid);
  const { data: followers, isLoading } = useFollowers(id);
  const isMe = myUid === id;

  return (
    <UserList
      users={followers}
      isLoading={isLoading}
      emptyTitle={isMe ? 'Todavía no tenés seguidores' : 'Todavía no tiene seguidores'}
      emptySubtitle={
        isMe
          ? 'Publicá prendas y sumá tus redes al perfil: la gente sigue a quien publica seguido.'
          : undefined
      }
    />
  );
}
