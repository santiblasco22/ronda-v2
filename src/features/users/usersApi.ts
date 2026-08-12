import {
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { FollowEdge, SocialLinks, UserProfile } from '@/types/models';
import { normalizeUsername } from '@/utils/validators';

function userDocRef(uid: string) {
  return doc(db, 'users', uid);
}

function fromSnapshot(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    email: (data.email as string | null) ?? null,
    username: (data.username as string) ?? '',
    usernameLower: (data.usernameLower as string) ?? '',
    displayName: (data.displayName as string) ?? '',
    bio: (data.bio as string) ?? '',
    avatarUrl: (data.avatarUrl as string | null) ?? null,
    city: (data.city as string) ?? '',
    socialLinks: (data.socialLinks as SocialLinks) ?? {},
    isPro: Boolean(data.isPro),
    proSince: (data.proSince as number | null) ?? null,
    listingCount: Number(data.listingCount ?? 0),
    activeListingCount: Number(data.activeListingCount ?? 0),
    followerCount: Number(data.followerCount ?? 0),
    followingCount: Number(data.followingCount ?? 0),
    ratingAvg: Number(data.ratingAvg ?? 0),
    ratingCount: Number(data.ratingCount ?? 0),
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  return fromSnapshot(uid, snap.data());
}

export async function isUsernameTaken(username: string, excludeUid?: string): Promise<boolean> {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('usernameLower', '==', normalizeUsername(username)), limit(2));
  const snap = await getDocs(q);
  return snap.docs.some((d) => d.id !== excludeUid);
}

export interface CreateProfileInput {
  uid: string;
  email: string | null;
  username: string;
  displayName: string;
  city: string;
}

export async function createUserProfile(input: CreateProfileInput): Promise<UserProfile> {
  const now = Date.now();
  const usernameLower = normalizeUsername(input.username);
  const data = {
    email: input.email,
    username: input.username.trim(),
    usernameLower,
    displayName: input.displayName.trim(),
    bio: '',
    avatarUrl: null,
    city: input.city.trim(),
    socialLinks: {},
    isPro: false,
    proSince: null,
    listingCount: 0,
    activeListingCount: 0,
    followerCount: 0,
    followingCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(userDocRef(input.uid), data);
  return fromSnapshot(input.uid, data);
}

export interface UpdateProfileInput {
  displayName?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string | null;
  socialLinks?: SocialLinks;
}

export async function updateUserProfile(uid: string, input: UpdateProfileInput): Promise<void> {
  await updateDoc(userDocRef(uid), {
    ...input,
    updatedAt: Date.now(),
  });
}

/**
 * Recalcula los contadores del propio usuario (followers/following/listings/ratings)
 * a partir de las subcolecciones reales y los persiste en su documento.
 * Solo el propio usuario puede llamar esto (regla: self-write only).
 */
export async function refreshOwnAggregates(uid: string): Promise<void> {
  const followersQuery = collection(db, 'users', uid, 'followers');
  const followingQuery = collection(db, 'users', uid, 'following');
  const listingsAllQuery = query(collection(db, 'listings'), where('sellerId', '==', uid));
  const listingsActiveQuery = query(
    collection(db, 'listings'),
    where('sellerId', '==', uid),
    where('status', '==', 'active')
  );
  const ratingsQuery = query(collection(db, 'ratings'), where('ratedUserId', '==', uid));

  const [followersCount, followingCount, listingsCount, activeListingsCount, ratingsSnap] =
    await Promise.all([
      getCountFromServer(followersQuery),
      getCountFromServer(followingQuery),
      getCountFromServer(listingsAllQuery),
      getCountFromServer(listingsActiveQuery),
      getDocs(ratingsQuery),
    ]);

  const stars = ratingsSnap.docs.map((d) => Number(d.data().stars ?? 0));
  const ratingCount = stars.length;
  const ratingAvg = ratingCount > 0 ? stars.reduce((a, b) => a + b, 0) / ratingCount : 0;

  await updateDoc(userDocRef(uid), {
    followerCount: followersCount.data().count,
    followingCount: followingCount.data().count,
    listingCount: listingsCount.data().count,
    activeListingCount: activeListingsCount.data().count,
    ratingAvg: Math.round(ratingAvg * 10) / 10,
    ratingCount,
    updatedAt: Date.now(),
  });
}

export async function getFollowers(uid: string): Promise<FollowEdge[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'followers'));
  return snap.docs.map((d) => d.data() as FollowEdge);
}

export async function getFollowing(uid: string): Promise<FollowEdge[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'following'));
  return snap.docs.map((d) => d.data() as FollowEdge);
}

export async function isFollowing(uid: string, targetUid: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'users', uid, 'following', targetUid));
  return snap.exists();
}

export async function followUser(current: UserProfile, target: UserProfile): Promise<void> {
  const now = Date.now();
  await Promise.all([
    setDoc(doc(db, 'users', current.uid, 'following', target.uid), {
      uid: target.uid,
      username: target.username,
      displayName: target.displayName,
      avatarUrl: target.avatarUrl,
      createdAt: now,
    }),
    setDoc(doc(db, 'users', target.uid, 'followers', current.uid), {
      uid: current.uid,
      username: current.username,
      displayName: current.displayName,
      avatarUrl: current.avatarUrl,
      createdAt: now,
    }),
    updateDoc(userDocRef(current.uid), { followingCount: current.followingCount + 1 }),
    setDoc(doc(collection(db, 'users', target.uid, 'notifications')), {
      type: 'new_follower',
      title: 'Nuevo seguidor',
      body: `${current.displayName} (@${current.username}) empezó a seguirte.`,
      read: false,
      createdAt: now,
      data: { uid: current.uid },
    }),
  ]);
}

export async function unfollowUser(
  currentUid: string,
  currentFollowingCount: number,
  targetUid: string
): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, 'users', currentUid, 'following', targetUid)),
    deleteDoc(doc(db, 'users', targetUid, 'followers', currentUid)),
    updateDoc(userDocRef(currentUid), {
      followingCount: Math.max(0, currentFollowingCount - 1),
    }),
  ]);
}
