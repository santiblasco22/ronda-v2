import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { uploadListingPhotos } from '@/lib/upload';
import type {
  Listing,
  ListingCategory,
  ListingCondition,
  ListingSize,
  ListingStatus,
  UserProfile,
} from '@/types/models';

function listingsCol() {
  return collection(db, 'listings');
}

function isActive(status: ListingStatus): boolean {
  return status === 'active';
}

function fromSnapshot(id: string, data: Record<string, unknown>): Listing {
  return {
    id,
    sellerId: data.sellerId as string,
    sellerUsername: data.sellerUsername as string,
    sellerDisplayName: data.sellerDisplayName as string,
    sellerAvatarUrl: (data.sellerAvatarUrl as string | null) ?? null,
    sellerIsPro: Boolean(data.sellerIsPro),
    title: data.title as string,
    description: (data.description as string) ?? '',
    price: Number(data.price ?? 0),
    category: data.category as ListingCategory,
    size: data.size as ListingSize,
    condition: data.condition as ListingCondition,
    color: (data.color as string) ?? '',
    city: (data.city as string) ?? '',
    photos: (data.photos as string[]) ?? [],
    status: data.status as ListingStatus,
    likeCount: Number(data.likeCount ?? 0),
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

export async function getListing(id: string): Promise<Listing | null> {
  const snap = await getDoc(doc(db, 'listings', id));
  if (!snap.exists()) return null;
  return fromSnapshot(snap.id, snap.data());
}

export async function getListingsBySeller(sellerId: string): Promise<Listing[]> {
  const q = query(listingsCol(), where('sellerId', '==', sellerId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromSnapshot(d.id, d.data()));
}

export interface CreateListingInput {
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  size: ListingSize;
  condition: ListingCondition;
  color: string;
  city: string;
  localPhotoUris: string[];
}

/**
 * Alta de publicación. El documento y el contador de publicaciones activas
 * del vendedor viajan en el mismo batch porque las reglas exigen ese par:
 * es lo que hace que el tope FREE/PRO se aplique del lado del servidor y no
 * solo en la UI.
 */
export async function createListing(seller: UserProfile, input: CreateListingInput): Promise<string> {
  const newRef = doc(listingsCol());
  const photos = await uploadListingPhotos(seller.uid, newRef.id, input.localPhotoUris);
  const now = Date.now();

  const batch = writeBatch(db);
  batch.set(newRef, {
    sellerId: seller.uid,
    // Las reglas verifican que estos campos coincidan con users/{uid}.
    sellerUsername: seller.username,
    sellerDisplayName: seller.displayName,
    sellerAvatarUrl: seller.avatarUrl,
    sellerIsPro: seller.isPro,
    title: input.title.trim(),
    description: input.description.trim(),
    price: input.price,
    category: input.category,
    size: input.size,
    condition: input.condition,
    color: input.color.trim(),
    city: input.city.trim(),
    photos,
    status: 'active' satisfies ListingStatus,
    likeCount: 0,
    createdAt: now,
    updatedAt: now,
  });
  batch.update(doc(db, 'users', seller.uid), {
    activeListingCount: increment(1),
    lastListingOpId: newRef.id,
    updatedAt: now,
  });
  await batch.commit();

  return newRef.id;
}

export interface UpdateListingInput {
  title?: string;
  description?: string;
  price?: number;
  category?: ListingCategory;
  size?: ListingSize;
  condition?: ListingCondition;
  color?: string;
  city?: string;
  addLocalPhotoUris?: string[];
  keepPhotos?: string[];
}

export async function updateListing(
  sellerId: string,
  listingId: string,
  input: UpdateListingInput
): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: Date.now() };
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.description !== undefined) patch.description = input.description.trim();
  if (input.price !== undefined) patch.price = input.price;
  if (input.category !== undefined) patch.category = input.category;
  if (input.size !== undefined) patch.size = input.size;
  if (input.condition !== undefined) patch.condition = input.condition;
  if (input.color !== undefined) patch.color = input.color.trim();
  if (input.city !== undefined) patch.city = input.city.trim();

  if (input.addLocalPhotoUris?.length || input.keepPhotos) {
    const uploaded = input.addLocalPhotoUris?.length
      ? await uploadListingPhotos(sellerId, listingId, input.addLocalPhotoUris)
      : [];
    patch.photos = [...(input.keepPhotos ?? []), ...uploaded];
  }

  await updateDoc(doc(db, 'listings', listingId), patch);
}

/**
 * Cambiar el estado de una publicación mueve el cupo de publicaciones
 * activas. Igual que en el alta, las reglas exigen que ambos writes vayan
 * juntos (y que quede cupo si se está reactivando).
 */
export async function setListingStatus(
  sellerId: string,
  listingId: string,
  nextStatus: ListingStatus,
  previousStatus: ListingStatus
): Promise<void> {
  const now = Date.now();
  const listingRef = doc(db, 'listings', listingId);
  const changesActiveSlot = isActive(previousStatus) !== isActive(nextStatus);

  if (!changesActiveSlot) {
    await updateDoc(listingRef, { status: nextStatus, updatedAt: now });
    return;
  }

  const batch = writeBatch(db);
  batch.update(listingRef, { status: nextStatus, updatedAt: now });
  batch.update(doc(db, 'users', sellerId), {
    activeListingCount: increment(isActive(nextStatus) ? 1 : -1),
    lastListingOpId: listingId,
    updatedAt: now,
  });
  await batch.commit();
}

/**
 * Las reglas no permiten borrar una publicación activa (si no, el contador
 * podría bajar sin dejar rastro), así que primero se archiva —liberando el
 * cupo de forma auditable— y recién después se elimina.
 */
export async function deleteListing(
  sellerId: string,
  listingId: string,
  wasActive: boolean
): Promise<void> {
  if (wasActive) {
    await setListingStatus(sellerId, listingId, 'archived', 'active');
  }
  await deleteDoc(doc(db, 'listings', listingId));
}

export interface SearchFiltersInput {
  category?: ListingCategory | null;
  size?: ListingSize | null;
  condition?: ListingCondition | null;
  city?: string;
  maxPrice?: number | null;
  query?: string;
}

/**
 * Búsqueda de listings activos. Firestore no soporta full-text search nativo
 * ni combinar muchos filtros de igualdad sin índices compuestos adicionales,
 * así que se trae la lista de activos (ordenada por fecha) con un único
 * índice simple y se afina por categoría/talle/estado/ciudad/precio/texto en
 * el cliente. Es una solución razonable para el volumen de datos de un MVP.
 */
export async function searchActiveListings(filters: SearchFiltersInput): Promise<Listing[]> {
  const q = query(listingsCol(), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  let results = snap.docs.map((d) => fromSnapshot(d.id, d.data()));

  if (filters.category) {
    results = results.filter((l) => l.category === filters.category);
  }
  if (filters.size) {
    results = results.filter((l) => l.size === filters.size);
  }
  if (filters.condition) {
    results = results.filter((l) => l.condition === filters.condition);
  }
  if (filters.city?.trim()) {
    const cityLower = filters.city.trim().toLowerCase();
    results = results.filter((l) => l.city.toLowerCase().includes(cityLower));
  }
  if (filters.maxPrice) {
    results = results.filter((l) => l.price <= filters.maxPrice!);
  }
  if (filters.query?.trim()) {
    const needle = filters.query.trim().toLowerCase();
    results = results.filter(
      (l) => l.title.toLowerCase().includes(needle) || l.description.toLowerCase().includes(needle)
    );
  }
  return results;
}

export async function getActiveListingsExcluding(excludeIds: Set<string>, excludeSellerId: string) {
  const q = query(listingsCol(), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => fromSnapshot(d.id, d.data()))
    .filter((l) => l.sellerId !== excludeSellerId && !excludeIds.has(l.id));
}

export async function getFollowingFeed(followingUids: string[]): Promise<Listing[]> {
  if (followingUids.length === 0) return [];
  // Firestore limita "in" a 30 valores; suficiente para un MVP.
  const chunks: string[][] = [];
  for (let i = 0; i < followingUids.length; i += 30) {
    chunks.push(followingUids.slice(i, i + 30));
  }
  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const q = query(
        listingsCol(),
        where('sellerId', 'in', chunk),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => fromSnapshot(d.id, d.data()));
    })
  );
  return results.flat().sort((a, b) => b.createdAt - a.createdAt);
}
