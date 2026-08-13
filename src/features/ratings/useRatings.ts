import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

import { createRating, type CreateRatingInput, getRatingsForUser, hasRated } from './ratingsApi';

export function useRatingsForUser(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.ratingsForUser(uid ?? 'unknown'),
    queryFn: () => getRatingsForUser(uid as string),
    enabled: Boolean(uid),
  });
}

/** Cada persona puede calificar una sola vez a otra (id determinístico). */
export function useHasRated(ratedUserId: string | undefined) {
  const myUid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: queryKeys.hasRated(myUid ?? 'unknown', ratedUserId ?? 'unknown'),
    queryFn: () => hasRated(myUid as string, ratedUserId as string),
    enabled: Boolean(myUid) && Boolean(ratedUserId),
  });
}

export function useCreateRating() {
  const queryClient = useQueryClient();
  const rater = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: (input: CreateRatingInput) => {
      if (!rater) throw new Error('Necesitás iniciar sesión.');
      return createRating(rater, input);
    },
    onSuccess: (_data, input) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ratingsForUser(input.ratedUserId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.userStats(input.ratedUserId) });
      if (rater) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.hasRated(rater.uid, input.ratedUserId),
        });
      }
    },
  });
}
