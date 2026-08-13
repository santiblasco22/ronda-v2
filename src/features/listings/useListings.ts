import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const queryClient = useQueryClient();
  const profile = useAuthStore((s) => s.profile);

  return useMutation({
    mutationFn: (input: CreateListingInput) => {
      if (!profile) throw new Error('Necesitás iniciar sesión.');
      return createListing(profile, input);
    },
    onSuccess: () => {
      if (!profile) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.myListings(profile.uid) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(profile.uid) });
    },
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.listing(variables.listingId) });
      if (uid) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.myListings(uid) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(uid) });
      }
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  const uid = useAuthStore((s) => s.firebaseUid);

  return useMutation({
    mutationFn: (listing: Listing) => {
      if (!uid) throw new Error('Necesitás iniciar sesión.');
      return deleteListing(uid, listing.id, listing.status === 'active');
    },
    onSuccess: () => {
      if (!uid) return;
      void queryClient.invalidateQueries({ queryKey: queryKeys.myListings(uid) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.userProfile(uid) });
    },
  });
}
