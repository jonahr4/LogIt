/**
 * LogIt — Firebase Storage helpers
 * Upload and delete photos for log entries.
 * Photos are stored at: photos/{userId}/{logId}/{uuid}.jpg
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImageManipulator from 'expo-image-manipulator';
import { firebaseApp } from '@/lib/firebase';

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB input limit

// Convert a local file URI to a Blob for Firebase upload
async function uriToBlob(uri: string): Promise<Blob> {
  const response = await fetch(uri);
  return response.blob();
}

/**
 * Compress a local image URI and upload it to Firebase Storage.
 * Compresses to ≤1200px wide @ quality 0.55 → typically 300–500KB output.
 *
 * @returns { url, firebasePath } — download URL + path for future deletion
 */
export async function uploadPhoto(
  localUri: string,
  userId: string,
  logId: string
): Promise<{ url: string; firebasePath: string }> {
  // Validate file size before compressing
  const response = await fetch(localUri);
  const rawBlob = await response.blob();
  if (rawBlob.size > MAX_FILE_BYTES) {
    throw new Error('Photo must be under 5MB.');
  }

  // Compress — resize to 1200px wide, JPEG at 0.55 quality
  const compressed = await ImageManipulator.manipulateAsync(
    localUri,
    [{ resize: { width: 1200 } }],
    { compress: 0.55, format: ImageManipulator.SaveFormat.JPEG }
  );

  const blob = await uriToBlob(compressed.uri);
  const storage = getStorage(firebaseApp);
  const firebasePath = `photos/${userId}/${logId}/${Date.now()}.jpg`;
  const storageRef = ref(storage, firebasePath);

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });
  const url = await getDownloadURL(storageRef);

  return { url, firebasePath };
}

/**
 * Delete a photo from Firebase Storage by its path.
 */
export async function deletePhotoFromStorage(firebasePath: string): Promise<void> {
  const storage = getStorage(firebaseApp);
  const storageRef = ref(storage, firebasePath);
  await deleteObject(storageRef);
}
