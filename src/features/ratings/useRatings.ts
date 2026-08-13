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

export function useHasRated(ratedUserId: string | undefined, listingId: string | null) {
  const myUid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: ['hasRated', myUid, ratedUserId, listingId],
    queryFn: () => hasRated(myUid as string, ratedUserId as string, listingId),
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
      void queryClient.invalidateQueries({ queryKey: ['hasRated'] });
    },
  });
}
