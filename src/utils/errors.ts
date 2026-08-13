/**
 * Las reglas de Firestore son la última palabra en varias operaciones
 * (unicidad de nombre de usuario, una calificación por persona, tope de
 * publicaciones activas). Cuando rechazan un write llega un
 * `permission-denied`, y eso casi siempre significa "otra persona llegó
 * primero" o "ya lo hiciste", no un error genérico: conviene traducirlo.
 */
export function firebaseErrorCode(error: unknown): string {
  return (error as { code?: string } | null)?.code ?? '';
}

export function isPermissionDenied(error: unknown): boolean {
  return firebaseErrorCode(error) === 'permission-denied';
}
