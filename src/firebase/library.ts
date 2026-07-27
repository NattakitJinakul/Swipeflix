/**
 * Firestore library CRUD. Subcollections under the user doc, one per status:
 *   users/{uid}/liked/{movieId}, users/{uid}/watched/{movieId}, users/{uid}/disliked/{movieId}
 * liked/watched store MovieLite; disliked stores just the id (docs/03).
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { MovieLite } from '../types/movie';
import { db } from './config';

export type MovieStatus = 'liked' | 'watched' | 'disliked';

export type LibrarySnapshot = {
  liked: MovieLite[];
  watched: MovieLite[];
  disliked: number[];
};

const itemRef = (uid: string, status: MovieStatus, id: number | string) =>
  doc(db, 'users', uid, status, String(id));

/** Add a movie to liked/watched (stores MovieLite). */
export async function addToLibrary(
  uid: string,
  movie: MovieLite,
  status: 'liked' | 'watched'
): Promise<void> {
  await setDoc(itemRef(uid, status, movie.id), { ...movie, addedAt: serverTimestamp() });
}

/** Record a dislike (id only). */
export async function addDisliked(uid: string, id: number): Promise<void> {
  await setDoc(itemRef(uid, 'disliked', id), { id, at: serverTimestamp() });
}

export async function removeFromLibrary(
  uid: string,
  id: number,
  status: MovieStatus
): Promise<void> {
  await deleteDoc(itemRef(uid, status, id));
}

/** Move a movie from one status to another (delete old doc, write new). */
export async function moveStatus(
  uid: string,
  movie: MovieLite,
  from: MovieStatus,
  to: MovieStatus
): Promise<void> {
  await removeFromLibrary(uid, movie.id, from);
  if (to === 'disliked') await addDisliked(uid, movie.id);
  else await addToLibrary(uid, movie, to);
}

export async function fetchLibrary(uid: string): Promise<LibrarySnapshot> {
  const [likedSnap, watchedSnap, dislikedSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'liked')),
    getDocs(collection(db, 'users', uid, 'watched')),
    getDocs(collection(db, 'users', uid, 'disliked')),
  ]);
  const toLite = (data: Record<string, unknown>): MovieLite => ({
    id: Number(data.id),
    title: String(data.title ?? ''),
    poster: (data.poster as string | null) ?? null,
    rating: Number(data.rating ?? 0),
    genreIds: (data.genreIds as number[]) ?? [],
    year: (data.year as string | null) ?? null,
  });
  return {
    liked: likedSnap.docs.map((d) => toLite(d.data())),
    watched: watchedSnap.docs.map((d) => toLite(d.data())),
    disliked: dislikedSnap.docs.map((d) => Number(d.data().id ?? d.id)),
  };
}
