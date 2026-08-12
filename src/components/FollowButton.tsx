import { useFollowMutation, useIsFollowing } from '@/features/users/useUserProfile';
import type { UserProfile } from '@/types/models';

import { Button } from './Button';

export function FollowButton({ target, small }: { target: UserProfile; small?: boolean }) {
  const { data: following, isLoading } = useIsFollowing(target.uid);
  const mutation = useFollowMutation();

  return (
    <Button
      label={following ? 'Siguiendo' : 'Seguir'}
      variant={following ? 'outline' : 'primary'}
      small={small}
      loading={mutation.isPending || isLoading}
      onPress={() => mutation.mutate(target)}
    />
  );
}
