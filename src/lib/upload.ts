import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { storage } from '@/lib/firebase';

/** Sube una imagen local (uri de expo-image-picker) a Storage y devuelve su URL pública. */
export async function uploadImageAsync(localUri: string, storagePath: string): Promise<string> {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(storageRef);
}

export async function uploadListingPhotos(
  sellerId: string,
  listingId: string,
  localUris: string[]
): Promise<string[]> {
  const uploads = localUris.map((uri, index) =>
    uploadImageAsync(uri, `listings/${sellerId}/${listingId}/photo_${index}_${Date.now()}.jpg`)
  );
  return Promise.all(uploads);
}

export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  return uploadImageAsync(localUri, `avatars/${uid}/avatar_${Date.now()}.jpg`);
}
