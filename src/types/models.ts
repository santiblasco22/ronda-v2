/**
 * Modelo de datos de Ronda.
 *
 * Colecciones de Firestore:
 * - users/{uid}
 *    - following/{targetUid}
 *    - followers/{followerUid}
 *    - interactions/{listingId}
 *    - notifications/{notificationId}
 * - listings/{listingId}
 * - ratings/{ratingId}
 * - pro_account_requests/{requestId}
 *
 * Los campos "denormalizados" (prefijo seller* / rater* / user*) se copian al
 * momento de crear el documento para poder listar y filtrar sin hacer joins.
 * Las reglas de seguridad los validan contra el documento real de users/{uid},
 * así que no se pueden falsear desde el cliente.
 *
 * Los contadores sociales (followerCount, followingCount, listingCount,
 * ratingAvg, ratingCount) viven en Firestore pero NINGÚN cliente puede
 * escribirlos: quedan reservados para una Cloud Function. Por eso no forman
 * parte de `UserProfile` — la app calcula esos números al vuelo con
 * `getUserStats()` (ver `features/users/usersApi.ts`).
 */

export type ListingStatus = 'active' | 'sold' | 'archived';

export type ProAccountRequestStatus = 'pending' | 'approved' | 'rejected';

export type InteractionAction = 'like' | 'pass';

export type NotificationType =
  | 'new_follower'
  | 'new_rating'
  | 'listing_liked'
  | 'pro_request_approved'
  | 'pro_request_rejected';

export interface SocialLinks {
  instagram?: string;
  whatsapp?: string;
  facebook?: string;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  username: string;
  usernameLower: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  city: string;
  socialLinks: SocialLinks;
  isPro: boolean;
  proSince: number | null;
  /**
   * Único contador escribible por el cliente, porque las reglas lo usan para
   * aplicar el tope de publicaciones activas del plan. Solo puede moverse ±1
   * y siempre en el mismo write que la publicación que lo justifica.
   */
  activeListingCount: number;
  createdAt: number;
  updatedAt: number;
}

/** Números sociales calculados al vuelo desde las colecciones de origen. */
export interface UserStats {
  followers: number;
  following: number;
  activeListings: number;
  ratingAvg: number;
  ratingCount: number;
}

export interface FollowEdge {
  uid: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: number;
}

export interface Interaction {
  listingId: string;
  action: InteractionAction;
  createdAt: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: number;
  data?: Record<string, string>;
}

export const LISTING_CATEGORIES = [
  'Remeras',
  'Camisas',
  'Buzos',
  'Camperas',
  'Pantalones',
  'Polleras',
  'Vestidos',
  'Calzado',
  'Accesorios',
  'Otros',
] as const;
export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const LISTING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Único'] as const;
export type ListingSize = (typeof LISTING_SIZES)[number];

export const LISTING_CONDITIONS = [
  'Nuevo con etiqueta',
  'Como nuevo',
  'Buen estado',
  'Con detalles',
] as const;
export type ListingCondition = (typeof LISTING_CONDITIONS)[number];

export interface Listing {
  id: string;
  sellerId: string;
  sellerUsername: string;
  sellerDisplayName: string;
  sellerAvatarUrl: string | null;
  sellerIsPro: boolean;
  title: string;
  description: string;
  price: number;
  category: ListingCategory;
  size: ListingSize;
  condition: ListingCondition;
  color: string;
  city: string;
  photos: string[];
  status: ListingStatus;
  likeCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface Rating {
  id: string;
  raterId: string;
  raterUsername: string;
  raterDisplayName: string;
  raterAvatarUrl: string | null;
  ratedUserId: string;
  listingId: string | null;
  listingTitle: string | null;
  stars: number;
  comment: string;
  createdAt: number;
}

export interface ProAccountRequest {
  id: string;
  userId: string;
  userUsername: string;
  userDisplayName: string;
  message: string;
  status: ProAccountRequestStatus;
  reviewerNote: string | null;
  createdAt: number;
  reviewedAt: number | null;
}
