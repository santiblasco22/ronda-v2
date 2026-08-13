import { collection, doc, getDocs, increment, writeBatch } from 'firebase/firestore';

import { getActiveListingsExcluding, getFollowingFeed } from '@/features/listings/listingsApi';
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

/**
 * Registra el swipe y, si fue "me gusta", suma el like en el mismo batch.
 * Las reglas solo aceptan +1 en likeCount cuando viene acompañado de la
 * interacción (que es inmutable), así que el like es idempotente: como mucho
 * uno por usuario y publicación, aunque la app reintente.
 */
export async function recordInteraction(
  uid: string,
  listing: Listing,
  action: InteractionAction
): Promise<void> {
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid, 'interactions', listing.id), {
    listingId: listing.id,
    action,
    createdAt: Date.now(),
  });
  if (action === 'like') {
    batch.update(doc(db, 'listings', listing.id), { likeCount: increment(1) });
  }
  await batch.commit();
}

export async function getFollowingFeedFor(followingUids: string[]): Promise<Listing[]> {
  return getFollowingFeed(followingUids);
}
