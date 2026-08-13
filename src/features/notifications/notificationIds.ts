/**
 * Ids determinísticos de los avisos, replicados en firestore.rules.
 *
 * El id depende de quién dispara la acción, así que un mismo emisor siempre
 * escribe el mismo documento: no puede llenar la bandeja de otra persona
 * repitiendo la acción (ni metiendo varios avisos en un mismo batch, porque
 * Firestore no deja escribir dos veces el mismo documento en un write).
 */
export function followNotificationId(actorUid: string): string {
  return `new_follower__${actorUid}`;
}

export function ratingNotificationId(raterUid: string): string {
  return `new_rating__${raterUid}`;
}
