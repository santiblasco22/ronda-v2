import { collection, doc, getDocs, increment, writeBatch } from 'firebase/firestore';

import { getActiveListingsExcluding, getFollowingFeed } from '@/features/listings/listingsApi';
import { getFollowing } from '@/features/users/usersApi';
import { db } from '@/lib/firebase';
import type { InteractionAction, Listing } from '@/types/models';

export async function getSwipedListingIds(uid: string): Promise<Set<string>> {
  const snap = await getDocs(collection(db, 'users', uid, 'interactions'));
  return new Set(snap.docs.map((d) => d.id));
}

function normalizedCity(city: string | undefined): string {
  return (city ?? '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Ranking simple y explicable para el MVP: vendedores seguidos primero,
 * luego publicaciones de la misma ciudad (si el perfil tiene una) y, dentro
 * de cada grupo, las más recientes. No altera el array de entrada.
 */
export function rankDiscoveryListings(
  listings: Listing[],
  followedSellerIds: Set<string>,
  viewerCity?: string
): Listing[] {
  const city = normalizedCity(viewerCity);

  return [...listings].sort((a, b) => {
    const followedDifference =
      Number(followedSellerIds.has(b.sellerId)) - Number(followedSellerIds.has(a.sellerId));
    if (followedDifference !== 0) return followedDifference;

    if (city) {
      const cityDifference =
        Number(normalizedCity(b.city) === city) - Number(normalizedCity(a.city) === city);
      if (cityDifference !== 0) return cityDifference;
    }

    return b.createdAt - a.createdAt;
  });
}

export async function getDiscoveryQueue(uid: string, viewerCity?: string): Promise<Listing[]> {
  const [swiped, following] = await Promise.all([getSwipedListingIds(uid), getFollowing(uid)]);
  const listings = await getActiveListingsExcluding(swiped, uid);
  return rankDiscoveryListings(listings, new Set(following.map((edge) => edge.uid)), viewerCity);
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
