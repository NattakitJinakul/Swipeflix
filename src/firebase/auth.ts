/**
 * Auth operations (Firebase JS SDK). Email/password + Google credential.
 * New users get a users/{uid} doc seeded with default profile + free subscription (docs/09).
 */
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { UserProfile } from '../types/user';
import { auth, db } from './config';

export function defaultProfile(user: User, displayName?: string): UserProfile {
  return {
    uid: user.uid,
    displayName: displayName ?? user.displayName ?? '',
    email: user.email ?? '',
    avatar: user.photoURL ?? null,
    region: 'TH',
    language: 'en',
    theme: 'system',
    favoriteGenres: [],
  };
}

/** Create users/{uid} doc if it does not exist yet. Returns true when a new doc was created. */
export async function ensureUserDoc(user: User, displayName?: string): Promise<boolean> {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return false;
  await setDoc(ref, {
    profile: defaultProfile(user, displayName),
    createdAt: serverTimestamp(),
  });
  return true;
}

export async function signUpEmail(
  email: string,
  password: string,
  displayName: string
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) await updateProfile(cred.user, { displayName });
  // Fire-and-forget: don't block the sign-up flow on a Firestore write (which can hang
  // if the DB isn't reachable / rules pending). The doc is seeded in the background.
  ensureUserDoc(cred.user, displayName).catch((e) => console.warn('[auth] ensureUserDoc failed', e));
  return cred.user;
}

export async function signInEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function observeAuth(cb: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, cb);
}

/** Sign in with a Google idToken (from expo-auth-session). Seeds user doc on first sign-in. */
export async function googleCredential(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const cred = await signInWithCredential(auth, credential);
  ensureUserDoc(cred.user).catch((e) => console.warn('[auth] ensureUserDoc failed', e));
  return cred.user;
}
