/**
 * Auth context. Wraps observeAuth, loads the user's profile doc, exposes sign in/up/out + Google
 * and a profile updater (display name / avatar).
 */
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  googleCredential,
  observeAuth,
  signInEmail,
  signOutUser,
  signUpEmail,
} from '../firebase/auth';
import { db } from '../firebase/config';
import { updateProfileFields, type ProfileFields } from '../firebase/profiles';
import type { UserProfile } from '../types/user';

export type AuthContextValue = {
  user: User | null;
  /** Guest-first: true when no signed-in user. Library runs in-memory; saves prompt login. */
  isGuest: boolean;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
  /** Patch the signed-in user's profile (display name / avatar) — Firestore + local state. */
  updateProfile: (fields: ProfileFields) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Resolve `p` but never wait longer than `ms` — returns `fallback` on timeout or error. */
function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    p.catch(() => fallback),
    new Promise<T>((res) => setTimeout(() => res(fallback), ms)),
  ]);
}

async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return (snap.data().profile as UserProfile | undefined) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observeAuth(async (u) => {
      setUser(u);
      if (u) {
        // Timeout-guarded so a slow/unconfigured Firestore never freezes the auth gate.
        const prof = await withTimeout(loadProfile(u.uid), 5000, null);
        setProfile(prof);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInEmail(email, password);
  }, []);

  const signUp = useCallback(
    async (email: string, password: string, displayName: string) => {
      // Resolve as soon as the auth account exists; observeAuth loads the profile.
      await signUpEmail(email, password, displayName);
    },
    []
  );

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  const googleSignIn = useCallback(async (idToken: string) => {
    await googleCredential(idToken);
  }, []);

  const updateProfile = useCallback(
    async (fields: ProfileFields) => {
      const uid = user?.uid;
      if (!uid) return;
      await updateProfileFields(uid, fields);
      setProfile((prev) => (prev ? { ...prev, ...fields } : prev));
    },
    [user?.uid]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isGuest: !user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      googleSignIn,
      updateProfile,
    }),
    [user, profile, loading, signIn, signUp, signOut, googleSignIn, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
