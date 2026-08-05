/**
 * User profile + public-profile (Community) Firestore helpers.
 * Private profile lives at users/{uid}.profile; a compact public summary at users/{uid}.public.
 * Every read is guarded — an unconfigured/unreachable Firestore yields empty results, never a throw
 * that crashes the UI (callers still catch, but these degrade gracefully too).
 */
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit as qLimit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import type { PublicGame, PublicProfile } from '../types/user';
import { auth, db } from './config';

export type ProfileFields = {
  displayName?: string;
  avatar?: string | null;
  showLikedGames?: boolean;
};

/** Patch the private profile map (merge) + mirror displayName onto the Firebase Auth user. */
export async function updateProfileFields(uid: string, fields: ProfileFields): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (fields.displayName !== undefined) patch.displayName = fields.displayName;
  if (fields.avatar !== undefined) patch.avatar = fields.avatar;
  if (fields.showLikedGames !== undefined) patch.showLikedGames = fields.showLikedGames;
  await setDoc(doc(db, 'users', uid), { profile: patch }, { merge: true });
  if (fields.displayName && auth.currentUser) {
    await fbUpdateProfile(auth.currentUser, { displayName: fields.displayName }).catch(() => {});
  }
}

/** Write/refresh the compact public summary used by Community listings. */
export async function writePublicProfile(
  uid: string,
  summary: Omit<PublicProfile, 'uid'>,
): Promise<void> {
  await setDoc(
    doc(db, 'users', uid),
    { public: { ...summary, uid, updatedAt: serverTimestamp() } },
    { merge: true },
  );
}

const toPublic = (data: Record<string, unknown>): PublicProfile | null => {
  const p = (data.public as Partial<PublicProfile> | undefined) ?? undefined;
  if (!p || !p.uid) return null;
  return {
    uid: String(p.uid),
    displayName: String(p.displayName ?? ''),
    avatar: (p.avatar as string | null) ?? null,
    favoriteGenres: Array.isArray(p.favoriteGenres) ? (p.favoriteGenres as string[]) : [],
    likedCount: Number(p.likedCount ?? 0),
    topGenres: Array.isArray(p.topGenres)
      ? (p.topGenres as { name: string; percent: number }[])
      : [],
    likedGames: Array.isArray(p.likedGames) ? (p.likedGames as PublicGame[]) : [],
  };
};

/** Top public profiles by liked count. Returns [] on any failure (unconfigured Firestore, rules). */
export async function listPublicProfiles(limitN = 50): Promise<PublicProfile[]> {
  try {
    const q = query(collection(db, 'users'), orderBy('public.likedCount', 'desc'), qLimit(limitN));
    const snap = await getDocs(q);
    return snap.docs.map((d) => toPublic(d.data())).filter((p): p is PublicProfile => !!p);
  } catch {
    return [];
  }
}

/** Client-side name search over the top public profiles (avoids a composite index). */
export async function searchProfilesByName(queryStr: string, limitN = 100): Promise<PublicProfile[]> {
  const q = queryStr.trim().toLowerCase();
  const all = await listPublicProfiles(limitN);
  if (!q) return all;
  return all.filter((p) => p.displayName.toLowerCase().includes(q));
}

/** A single user's public profile. Null when missing / unreachable. */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) return null;
    return toPublic(snap.data());
  } catch {
    return null;
  }
}
