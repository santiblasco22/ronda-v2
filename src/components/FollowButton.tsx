import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors } from '@/constants/colors';
import { Spacing, Typography } from '@/constants/theme';
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
    <View style={[small ? styles.compact : styles.block, style]}>
      <Button
        label={following ? 'Siguiendo' : 'Seguir'}
        accessibilityLabel={
          following ? `Dejar de seguir a @${target.username}` : `Seguir a @${target.username}`
        }
        icon={following ? 'checkmark' : 'person-add-outline'}
        variant={following ? 'outline' : 'primary'}
        small={small}
        loading={mutation.isPending || isLoading}
        onPress={() => {
          mutation.reset();
          mutation.mutate(target);
        }}
      />
      {mutation.isError ? (
        <Text style={styles.error} accessibilityLiveRegion="polite" accessibilityRole="alert">
          No pudimos actualizar el seguimiento. Revisá tu conexión y volvé a intentar.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    alignSelf: 'stretch',
  },
  compact: {
    maxWidth: 168,
    alignItems: 'flex-end',
  },
  error: {
    ...Typography.caption,
    color: Colors.dangerInk,
    marginTop: Spacing.xs,
  },
});
