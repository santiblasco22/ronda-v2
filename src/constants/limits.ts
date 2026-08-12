/** Límites y reglas de negocio de la app (deben coincidir con firestore.rules). */
export const MAX_LISTING_PHOTOS = 5;
export const MIN_LISTING_PHOTOS = 1;

export const FREE_ACCOUNT_LISTING_CAP = 5;
export const PRO_ACCOUNT_LISTING_CAP = 50;

export const MAX_BIO_LENGTH = 160;
export const MAX_LISTING_TITLE_LENGTH = 60;
export const MAX_LISTING_DESCRIPTION_LENGTH = 500;
export const MAX_RATING_COMMENT_LENGTH = 300;

export const MIN_USERNAME_LENGTH = 3;
export const MAX_USERNAME_LENGTH = 20;

export function getListingCapFor(isPro: boolean): number {
  return isPro ? PRO_ACCOUNT_LISTING_CAP : FREE_ACCOUNT_LISTING_CAP;
}
