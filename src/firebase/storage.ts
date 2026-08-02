/**
 * Firebase Storage helpers. Avatar uploads go to avatars/{uid}.jpg.
 * Never throws to callers that don't await catch — guarded, returns the download URL.
 */
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './config';

/**
 * Upload a local image uri as the user's avatar. Returns the public download URL.
 * Fetches the local uri into a blob, then uploadBytes -> getDownloadURL.
 */
export async function uploadAvatar(uid: string, localUri: string): Promise<string> {
  const res = await fetch(localUri);
  const blob = await res.blob();
  const r = ref(storage, `avatars/${uid}.jpg`);
  await uploadBytes(r, blob, { contentType: blob.type || 'image/jpeg' });
  return getDownloadURL(r);
}
