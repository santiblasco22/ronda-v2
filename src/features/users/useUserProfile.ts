import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { UserProfile } from '@/types/models';

import {
  followUser,
  getFollowers,
  getFollowing,
  getUserProfile,
  getUserStats,
  isFollowing,
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

/**
 * Seguidores / seguidos / publicaciones / calificaciones calculados desde las
 * colecciones de origen. Reemplaza a los contadores denormalizados, que ya no
 * son escribibles por ningún cliente.
 */
export function useUserStats(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userStats(uid ?? 'unknown'),
    queryFn: () => getUserStats(uid as string),
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

  return useMutation({
    mutationFn: async (target: UserProfile) => {
      if (!myProfile) throw new Error('Necesitás iniciar sesión.');
      const currentlyFollowing = await isFollowing(myProfile.uid, target.uid);
      if (currentlyFollowing) {
        await unfollowUser(myProfile.uid, target.uid);
      } else {
        await followUser(myProfile, target);
      }
      return !currentlyFollowing;
    },
    onSuccess: async (_nowFollowing, target) => {
      if (!myProfile) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.isFollowing(myProfile.uid, target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userStats(target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.userStats(myProfile.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.followers(target.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.following(myProfile.uid) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.followingFeed(myProfile.uid) }),
      ]);
    },
  });
}
