import { collection, doc, getDoc, getDocs, orderBy, query, where, writeBatch } from 'firebase/firestore';

import { ratingNotificationId } from '@/features/notifications/notificationIds';
import { db } from '@/lib/firebase';
import type { Rating, UserProfile } from '@/types/models';

function ratingsCol() {
  return collection(db, 'ratings');
}

/**
 * Id determinístico: una calificación por par (quien califica → calificado).
 * Como las reglas exigen que el id tenga exactamente esta forma y prohíben
 * update/delete, la unicidad la garantiza Firestore y no la UI.
 */
export function ratingIdFor(raterId: string, ratedUserId: string): string {
  return `${raterId}__${ratedUserId}`;
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

/** Una sola lectura por id, sin índices compuestos ni consultas. */
export async function hasRated(raterId: string, ratedUserId: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'ratings', ratingIdFor(raterId, ratedUserId)));
  return snap.exists();
}

export interface CreateRatingInput {
  ratedUserId: string;
  listingId: string | null;
  listingTitle: string | null;
  stars: number;
  comment: string;
}

export async function createRating(rater: UserProfile, input: CreateRatingInput): Promise<void> {
  const now = Date.now();
  const ratingRef = doc(db, 'ratings', ratingIdFor(rater.uid, input.ratedUserId));

  const batch = writeBatch(db);
  batch.set(ratingRef, {
    raterId: rater.uid,
    // Validados contra users/{uid} por las reglas.
    raterUsername: rater.username,
    raterDisplayName: rater.displayName,
    raterAvatarUrl: rater.avatarUrl,
    ratedUserId: input.ratedUserId,
    listingId: input.listingId,
    listingTitle: input.listingTitle,
    stars: input.stars,
    comment: input.comment.trim(),
    createdAt: now,
  });
  batch.set(doc(db, 'users', input.ratedUserId, 'notifications', ratingNotificationId(rater.uid)), {
    type: 'new_rating',
    title: 'Nueva calificación',
    body: `${rater.displayName} te dejó ${input.stars} ${input.stars === 1 ? 'estrella' : 'estrellas'}.`,
    read: false,
    createdAt: now,
    data: { uid: rater.uid },
  });

  await batch.commit();
}
