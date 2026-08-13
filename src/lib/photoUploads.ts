/**
 * Ronda funciona con Firebase Storage deshabilitado.
 *
 * Storage requiere plan Blaze, y el proyecto está a propósito en Spark: subir
 * fotos es una mejora opcional, no un requisito del flujo principal. Por eso
 * las fotos están apagadas salvo que se active explícitamente con
 * `EXPO_PUBLIC_ENABLE_PHOTO_UPLOADS=true` (y haya un bucket configurado).
 *
 * Con las fotos apagadas la app sigue completa: se publica sin imagen, las
 * tarjetas muestran un marcador de posición y los selectores explican por qué
 * están deshabilitados en vez de fallar al tocarlos.
 */

const bucketConfigured = Boolean(process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET);
const explicitlyEnabled = process.env.EXPO_PUBLIC_ENABLE_PHOTO_UPLOADS === 'true';

export const photoUploadsEnabled = bucketConfigured && explicitlyEnabled;

export const PHOTO_UPLOADS_DISABLED_TITLE = 'Las fotos están desactivadas';

export const PHOTO_UPLOADS_DISABLED_MESSAGE =
  'Esta instalación de Ronda no tiene almacenamiento de imágenes habilitado. ' +
  'Podés publicar igual: tu prenda se muestra con un marcador de posición y el ' +
  'resto de los datos (precio, talle, estado, ciudad) se ven normalmente.';

/** Error de subida ya traducido para mostrar en pantalla. */
export class PhotoUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhotoUploadError';
  }
}

const UNAVAILABLE_CODES = new Set([
  'storage/unauthorized',
  'storage/unknown',
  'storage/project-not-found',
  'storage/bucket-not-found',
  'storage/quota-exceeded',
  'storage/retry-limit-exceeded',
]);

/**
 * Traduce un error del SDK de Storage. Si el bucket no existe o no está
 * habilitado (lo esperable en plan Spark) se explica eso en vez de mostrar un
 * "error desconocido".
 */
export function describeUploadError(error: unknown): PhotoUploadError {
  const code = (error as { code?: string } | null)?.code ?? '';
  if (UNAVAILABLE_CODES.has(code)) {
    return new PhotoUploadError(
      'No pudimos guardar las fotos: el almacenamiento de imágenes no está ' +
        'disponible en este proyecto. Podés publicar sin fotos.'
    );
  }
  return new PhotoUploadError('No pudimos subir las fotos. Revisá tu conexión y probá de nuevo.');
}
