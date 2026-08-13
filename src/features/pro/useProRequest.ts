import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';

import { createProRequest, getLatestProRequest } from './proApi';

export function useLatestProRequest() {
  const uid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: queryKeys.proRequest(uid ?? 'unknown'),
    queryFn: () => getLatestProRequest(uid as string),
    enabled: Boolean(uid),
  });
}

export function useCreateProRequest() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: (message: string) => {
      if (!profile) throw new Error('Necesitás iniciar sesión.');
      return createProRequest(profile, message);
    },
    onSuccess: () => {
      if (!profile) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.proRequest(profile.uid) });
    },
  });
}
