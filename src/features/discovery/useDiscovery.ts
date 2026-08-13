import { useMutation, useQuery } from '@tanstack/react-query';

import { useFollowing } from '@/features/users/useUserProfile';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { InteractionAction, Listing } from '@/types/models';

import { getDiscoveryQueue, getFollowingFeedFor, recordInteraction } from './discoveryApi';

export function useDiscoveryQueue() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const city = useAuthStore((s) => s.profile?.city);
  return useQuery({
    queryKey: queryKeys.discoveryQueue(uid ?? 'unknown', { city: city ?? null }),
    queryFn: () => getDiscoveryQueue(uid as string, city),
    enabled: Boolean(uid),
  });
}

export function useRecordInteraction() {
  const uid = useAuthStore((s) => s.firebaseUid);

  return useMutation({
    mutationFn: ({ listing, action }: { listing: Listing; action: InteractionAction }) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return recordInteraction(uid, listing, action);
    },
  });
}

export function useFollowingFeed() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const { data: following } = useFollowing(uid ?? undefined);
  const followingIds = (following ?? []).map((f) => f.uid);

  return useQuery({
    queryKey: queryKeys.followingFeed(uid ?? 'unknown'),
    queryFn: () => getFollowingFeedFor(followingIds),
    enabled: Boolean(uid) && following !== undefined,
  });
}
