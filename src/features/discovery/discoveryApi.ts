import { collection, doc, getDocs, setDoc } from 'firebase/firestore';

import { getActiveListingsExcluding, getFollowingFeed, incrementListingLikes } from '@/features/listings/listingsApi';
import { db } from '@/lib/firebase';
import type { InteractionAction, Listing } from '@/types/models';

export async function getSwipedListingIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', uid, 'interactions'));
  return new Set(snap.docs.map((d) => d.id));
}

export async function getDiscoveryQueue(uid: string): Promise<Listing[]> {
  const swiped = await getSwipedListingIds(uid);
  return getActiveListingsExcluding(swiped, uid);
}

export async function recordInteraction(
  uid: string,
  listing: Listing,
  action: InteractionAction
): Promise<void> {
  await setDoc(doc(db, 'users', uid, 'interactions', listing.id), {
    listingId: listing.id,
    action,
    createdAt: Date.now(),
  });

  if (action === 'like') {
    await incrementListingLikes(listing.id, 1);
  }
}

export async function getFollowingFeedFor(followingUids: string[]): Promise<Listing[]> {
  return getFollowingFeed(followingUids);
}
