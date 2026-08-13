import type { ViewStyle } from 'react-native';

import { useFollowMutation, useIsFollowing } from '@/features/users/useUserProfile';
import type { UserProfile } from '@/types/models';

import { Button } from './Button';

export function FollowButton({
  target,
  small,
  style,
}: {
  target: UserProfile;
  small?: boolean;
  style?: ViewStyle;
}) {
  const { data: following, isLoading } = useIsFollowing(target.uid);
  const mutation = useFollowMutation();

  return (
    <Button
      label={following ? 'Siguiendo' : 'Seguir'}
      accessibilityLabel={
        following ? `Dejar de seguir a @${target.username}` : `Seguir a @${target.username}`
      }
      icon={following ? 'checkmark' : 'person-add-outline'}
      variant={following ? 'outline' : 'primary'}
      small={small}
      style={style}
      loading={mutation.isPending || isLoading}
      onPress={() => mutation.mutate(target)}
    />
  );
}
