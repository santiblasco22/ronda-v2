import { collection, doc, getDocs, orderBy, query, setDoc, where } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { Rating, UserProfile } from '@/types/models';

function ratingsCol() {
  return collection(db, 'ratings');
}

function fromSnapshot(id: string, data: Record<string, unknown>): Rating {
  return {
    id,
    raterId: data.raterId as string,
    raterUsername: data.raterUsername as string,
    raterDisplayName: data.raterDisplayName as string,
    raterAvatarUrl: (data.raterAvatarUrl as string | null) ?? null,
    ratedUserId: data.ratedUserId as string,
    listingId: (data.listingId as string | null) ?? null,
    listingTitle: (data.listingTitle as string | null) ?? null,
    stars: Number(data.stars ?? 0),
    comment: (data.comment as string) ?? '',
    createdAt: Number(data.createdAt ?? Date.now()),
  };
}

export async function getRatingsForUser(uid: string): Promise<Rating[]> {
  const q = query(ratingsCol(), where('ratedUserId', '==', uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromSnapshot(d.id, d.data()));
}

export async function hasRated(raterId: string, ratedUserId: string, listingId: string | null) {
  const q = listingId
    ? query(
        ratingsCol(),
        where('raterId', '==', raterId),
        where('ratedUserId', '==', ratedUserId),
        where('listingId', '==', listingId)
      )
    : query(ratingsCol(), where('raterId', '==', raterId), where('ratedUserId', '==', ratedUserId));
  const snap = await getDocs(q);
  return !snap.empty;
}

export interface CreateRatingInput {
  ratedUserId: string;
  listingId: string | null;
  listingTitle: string | null;
  stars: number;
  comment: string;
}

export async function createRating(rater: UserProfile, input: CreateRatingInput): Promise<void> {
  const newRef = doc(ratingsCol());
  await setDoc(newRef, {
    raterId: rater.uid,
    raterUsername: rater.username,
    raterDisplayName: rater.displayName,
    raterAvatarUrl: rater.avatarUrl,
    ratedUserId: input.ratedUserId,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    stars: input.stars,
    comment: input.comment.trim(),
    createdAt: Date.now(),
  });

  await setDoc(doc(collection(db, 'users', input.ratedUserId, 'notifications')), {
    type: 'new_rating',
    title: 'Nueva calificación',
    body: `${rater.displayName} te dejó ${input.stars} ${input.stars === 1 ? 'estrella' : 'estrellas'}.`,
    read: false,
    createdAt: Date.now(),
    data: { uid: rater.uid },
  });
}
