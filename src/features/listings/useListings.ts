import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getUserProfile } from '@/features/users/usersApi';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import type { Listing, ListingStatus } from '@/types/models';

import {
  type CreateListingInput,
  createListing,
  deleteListing,
  getListing,
  getListingsBySeller,
  type SearchFiltersInput,
  searchActiveListings,
  setListingStatus,
  type UpdateListingInput,
  updateListing,
} from './listingsApi';

/**
 * Después de cualquier alta/baja/cambio de estado hay que releer el perfil:
 * activeListingCount es lo que las reglas usan para aplicar el tope del plan,
 * así que la UI tiene que trabajar siempre con el valor real del servidor.
 */
function useRefreshSellerState() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.firebaseUid);
  const setProfile = useAuthStore((s) => s.setProfile);

  return async () => {
    if (!uid) return;
    const fresh = await getUserProfile(uid);
    setProfile(fresh);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.myListings(uid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userListings(uid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(uid) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.userStats(uid) }),
    ]);
  };
}

export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.listing(id ?? 'unknown'),
    queryFn: () => getListing(id as string),
    enabled: Boolean(id),
  });
}

export function useMyListings() {
  const uid = useAuthStore((s) => s.firebaseUid);
  return useQuery({
    queryKey: queryKeys.myListings(uid ?? 'unknown'),
    queryFn: () => getListingsBySeller(uid as string),
    enabled: Boolean(uid),
  });
}

export function useUserListings(uid: string | undefined) {
  return useQuery({
    queryKey: queryKeys.userListings(uid ?? 'unknown'),
    queryFn: () => getListingsBySeller(uid as string),
    enabled: Boolean(uid),
  });
}

export function useSearchListings(filters: SearchFiltersInput) {
  return useQuery({
    queryKey: queryKeys.searchListings(filters),
    queryFn: () => searchActiveListings(filters),
  });
}

export function useCreateListing() {
  const profile = useAuthStore((s) => s.profile);
  const refreshSellerState = useRefreshSellerState();

  return useMutation({
    mutationFn: (input: CreateListingInput) => {
      if (!profile) throw new Error('Necesitás iniciar sesión.');
      return createListing(profile, input);
    },
    onSuccess: refreshSellerState,
  });
}

export function useUpdateListing(listingId: string) {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.firebaseUid);

  return useMutation({
    mutationFn: (input: UpdateListingInput) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return updateListing(uid, listingId, input);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listing(listingId) });
      if (uid) void queryClient.invalidateQueries({ queryKey: queryKeys.myListings(uid) });
    },
  });
}

export function useSetListingStatus() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.firebaseUid);
  const refreshSellerState = useRefreshSellerState();

  return useMutation({
    mutationFn: ({
      listingId,
      nextStatus,
      previousStatus,
    }: {
      listingId: string;
      nextStatus: ListingStatus;
      previousStatus: ListingStatus;
    }) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return setListingStatus(uid, listingId, nextStatus, previousStatus);
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.listing(variables.listingId) });
      await refreshSellerState();
    },
  });
}

export function useDeleteListing() {
  const uid = useAuthStore((s) => s.firebaseUid);
  const refreshSellerState = useRefreshSellerState();

  return useMutation({
    mutationFn: (listing: Listing) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return deleteListing(uid, listing.id, listing.status === 'active');
    },
    onSuccess: refreshSellerState,
  });
}
