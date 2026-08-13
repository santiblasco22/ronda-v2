import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';
import { describeUploadError, photoUploadsEnabled } from '@/lib/photoUploads';

/** Sube una imagen local (uri de expo-image-picker) a Storage y devuelve su URL pública. */
async function uploadImageAsync(localUri: string, storagePath: string): Promise<string> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
    return await getDownloadURL(storageRef);
  } catch (error) {
    throw describeUploadError(error);
  }
}

/**
 * Con las fotos deshabilitadas devuelve una lista vacía en vez de fallar: la
 * publicación se crea igual (las reglas aceptan 0 fotos a propósito).
 */
export async function uploadListingPhotos(
  sellerId: string,
  listingId: string,
  localUris: string[]
): Promise<string[]> {
  if (!photoUploadsEnabled || localUris.length === 0) return [];
  const uploads = localUris.map((uri, index) =>
    uploadImageAsync(uri, `listings/${sellerId}/${listingId}/photo_${index}_${Date.now()}.jpg`)
  );
  return Promise.all(uploads);
}

export async function uploadAvatar(uid: string, localUri: string): Promise<string | null> {
  if (!photoUploadsEnabled) return null;
  return uploadImageAsync(localUri, `avatars/${uid}/avatar_${Date.now()}.jpg`);
}
