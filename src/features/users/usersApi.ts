import {
  average,
  collection,
  count,
  doc,
  getAggregateFromServer,
  getCountFromServer,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { followNotificationId } from '@/features/notifications/notificationIds';
import { db } from '@/lib/firebase';
import type { FollowEdge, SocialLinks, UserProfile, UserStats } from '@/types/models';
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
    activeListingCount: Number(data.activeListingCount ?? 0),
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

function followEdgeFor(user: UserProfile, createdAt: number): FollowEdge {
  return {
    uid: user.uid,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    createdAt,
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDocRef(uid));
  if (!snap.exists()) return null;
  return fromSnapshot(uid, snap.data());
}

/**
 * La unicidad real la garantiza la colección `usernames`, donde el id del
 * documento es el nombre: crearlo dos veces falla del lado del servidor. Esta
 * consulta es solo para avisar antes de enviar el formulario.
 */
export async function isUsernameTaken(username: string): Promise<boolean> {
  const snap = await getDoc(doc(db, 'usernames', normalizeUsername(username)));
  return snap.exists();
}

export interface CreateProfileInput {
  uid: string;
  email: string | null;
  username: string;
  displayName: string;
  city: string;
}

/**
 * Crea el perfil y reserva el nombre de usuario en un único batch. Si otra
 * persona se quedó con el nombre en el medio, `usernames/{nombre}` ya existe
 * y todo el batch falla: la unicidad no depende de la validación previa.
 */
export async function createUserProfile(input: CreateProfileInput): Promise<UserProfile> {
  const now = Date.now();
  const usernameLower = normalizeUsername(input.username);
  const data = {
    email: input.email,
    username: usernameLower,
    usernameLower,
    displayName: input.displayName.trim(),
    bio: '',
    avatarUrl: null,
    city: input.city.trim(),
    socialLinks: {},
    isPro: false,
    proSince: null,
    activeListingCount: 0,
    lastListingOpId: null,
    // Contadores reservados para Cloud Functions: se inicializan en cero y
    // ninguna regla permite que el cliente los vuelva a tocar. La app muestra
    // los números reales con getUserStats().
    listingCount: 0,
    followerCount: 0,
    followingCount: 0,
    ratingAvg: 0,
    ratingCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(userDocRef(input.uid), data);
  batch.set(doc(db, 'usernames', usernameLower), { uid: input.uid, createdAt: now });
  await batch.commit();

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
 * Calcula los números sociales de un perfil desde las colecciones de origen
 * (followers/following/listings/ratings) en vez de leer contadores
 * denormalizados. Son cuatro agregaciones del lado del servidor, así que no
 * se descargan documentos y nadie puede inflar sus propias métricas.
 */
export async function getUserStats(uid: string): Promise<UserStats> {
  const [followers, following, activeListings, ratings] = await Promise.all([
    getCountFromServer(collection(db, 'users', uid, 'followers')),
    getCountFromServer(collection(db, 'users', uid, 'following')),
    getCountFromServer(
      query(collection(db, 'listings'), where('sellerId', '==', uid), where('status', '==', 'active'))
    ),
    getAggregateFromServer(query(collection(db, 'ratings'), where('ratedUserId', '==', uid)), {
      ratingCount: count(),
      ratingAvg: average('stars'),
    }),
  ]);

  const ratingAvg = ratings.data().ratingAvg ?? 0;

  return {
    followers: followers.data().count,
    following: following.data().count,
    activeListings: activeListings.data().count,
    ratingCount: ratings.data().ratingCount,
    ratingAvg: Math.round(ratingAvg * 10) / 10,
  };
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

/**
 * Seguir escribe las dos puntas de la relación (y el aviso para la otra
 * persona) en un único batch: las reglas rechazan cualquiera de los tres
 * documentos por separado, así que no puede quedar una mitad huérfana.
 *
 * El aviso usa un id determinístico por emisor, de modo que seguir y dejar de
 * seguir en loop reescribe siempre el mismo documento en vez de acumular
 * avisos en la bandeja del otro.
 */
export async function followUser(current: UserProfile, target: UserProfile): Promise<void> {
  const now = Date.now();
  const batch = writeBatch(db);

  batch.set(
    doc(db, 'users', current.uid, 'following', target.uid),
    followEdgeFor(target, now)
  );
  batch.set(
    doc(db, 'users', target.uid, 'followers', current.uid),
    followEdgeFor(current, now)
  );
  batch.set(doc(db, 'users', target.uid, 'notifications', followNotificationId(current.uid)), {
    type: 'new_follower',
    title: 'Nuevo seguidor',
    body: `${current.displayName} (@${current.username}) empezó a seguirte.`,
    read: false,
    createdAt: now,
    data: { uid: current.uid },
  });

  await batch.commit();
}

/**
 * Dejar de seguir borra las dos puntas juntas: las reglas no permiten borrar
 * una sola (quedaría un seguidor fantasma contando en el perfil ajeno).
 */
export async function unfollowUser(currentUid: string, targetUid: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'users', currentUid, 'following', targetUid));
  batch.delete(doc(db, 'users', targetUid, 'followers', currentUid));
  await batch.commit();
}
