import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types/models';

import {
  followUser,
  getFollowers,
  getFollowing,
  getUserProfile,
  isFollowing,
  refreshOwnAggregates,
  unfollowUser,
  type UpdateProfileInput,
  updateUserProfile,
} from './usersApi';

export function useUserProfile(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userProfile(uid ?? 'unknown'),
    queryFn: () => getUserProfile(uid as string),
    enabled: Boolean(uid),
  });
}

export function useFollowers(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.followers(uid ?? 'unknown'),
    queryFn: () => getFollowers(uid as string),
    enabled: Boolean(uid),
  });
}

export function useFollowing(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.following(uid ?? 'unknown'),
    queryFn: () => getFollowing(uid as string),
    enabled: Boolean(uid),
  });
}

export function useIsFollowing(targetUid: string | undefined) {
  const myUid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: queryKeys.isFollowing(myUid ?? 'unknown', targetUid ?? 'unknown'),
    queryFn: () => isFollowing(myUid as string, targetUid as string),
    enabled: Boolean(myUid) && Boolean(targetUid) && myUid !== targetUid,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setProfile = useAuthStore((s) => s.setProfile);
  const uid = useAuthStore((s) => s.firebaseUid);

  return useMutation({
    mutationFn: (input: UpdateProfileInput) => updateUserProfile(uid as string, input),
    onSuccess: async () => {
      if (!uid) return;
      const fresh = await getUserProfile(uid);
      setProfile(fresh);
      await queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(uid) });
    },
  });
}

export function useFollowMutation() {
  const queryClient = useQueryClient();
  const myProfile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);

  return useMutation({
    mutationFn: async (target: UserProfile) => {
      if (!myProfile) throw new Error('Necesitás iniciar sesión.');
      const currentlyFollowing = await isFollowing(myProfile.uid, target.uid);
      if (currentlyFollowing) {
        await unfollowUser(myProfile.uid, myProfile.followingCount, target.uid);
      } else {
        await followUser(myProfile, target);
      }
      return !currentlyFollowing;
    },
    onSuccess: async (_nowFollowing, target) => {
      if (!myProfile) return;
      const fresh = await getUserProfile(myProfile.uid);
      setProfile(fresh);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.isFollowing(myProfile.uid, target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.followers(target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.following(myProfile.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.followingFeed(myProfile.uid) }),
      ]);
    },
  });
}

export function useRefreshOwnAggregates() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const setProfile = useAuthStore((s) => s.setProfile);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!uid) return;
      await refreshOwnAggregates(uid);
      const fresh = await getUserProfile(uid);
      setProfile(fresh);
    },
    onSuccess: () => {
      if (!uid) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(uid) });
    },
  });
}
