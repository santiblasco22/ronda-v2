import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/** Claves de query centralizadas para poder invalidar de forma consistente. */
export const queryKeys = {
  userProfile: (uid: string) => ['user', uid] as const,
  userStats: (uid: string) => ['userStats', uid] as const,
  userByUsername: (username: string) => ['userByUsername', username] as const,
  followers: (uid: string) => ['followers', uid] as const,
  following: (uid: string) => ['following', uid] as const,
  isFollowing: (uid: string, targetUid: string) => ['isFollowing', uid, targetUid] as const,
  listing: (id: string) => ['listing', id] as const,
  myListings: (uid: string) => ['myListings', uid] as const,
  userListings: (uid: string) => ['userListings', uid] as const,
  discoveryQueue: (uid: string, filters: unknown) => ['discoveryQueue', uid, filters] as const,
  followingFeed: (uid: string) => ['followingFeed', uid] as const,
  searchListings: (filters: unknown) => ['searchListings', filters] as const,
  ratingsForUser: (uid: string) => ['ratingsForUser', uid] as const,
  hasRated: (raterUid: string, ratedUid: string) => ['hasRated', raterUid, ratedUid] as const,
  notifications: (uid: string) => ['notifications', uid] as const,
  proRequest: (uid: string) => ['proRequest', uid] as const,
};
