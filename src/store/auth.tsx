/**
 * Auth context. Wraps observeAuth, loads the user's profile doc, exposes sign in/up/out + Google.
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
import { getSubscription } from '../firebase/subscription';
import type { Plan, UserProfile } from '../types/user';

export type AuthContextValue = {
  user: User | null;
  profile: UserProfile | null;
  /** Current subscription plan. Source of truth is the subscription doc; 'free' when absent/offline. */
  plan: Plan;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  googleSignIn: (idToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return (snap.data().profile as UserProfile | undefined) ?? null;
}

/** Read the subscription plan; never throws — defaults to 'free' on any failure/absence. */
async function loadPlan(uid: string): Promise<Plan> {
  try {
    const sub = await getSubscription(uid);
    return sub?.plan ?? 'free';
  } catch {
    return 'free';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<Plan>('free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = observeAuth(async (u) => {
      setUser(u);
      if (u) {
        try {
          const [prof, pl] = await Promise.all([loadProfile(u.uid), loadPlan(u.uid)]);
          setProfile(prof);
          setPlan(pl);
        } catch {
          setProfile(null);
          setPlan('free');
        }
      } else {
        setProfile(null);
        setPlan('free');
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
      const u = await signUpEmail(email, password, displayName);
      const [prof, pl] = await Promise.all([loadProfile(u.uid), loadPlan(u.uid)]);
      setProfile(prof);
      setPlan(pl);
    },
    []
  );

  const signOut = useCallback(async () => {
    await signOutUser();
  }, []);

  const googleSignIn = useCallback(async (idToken: string) => {
    const u = await googleCredential(idToken);
    const [prof, pl] = await Promise.all([loadProfile(u.uid), loadPlan(u.uid)]);
    setProfile(prof);
    setPlan(pl);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, profile, plan, loading, signIn, signUp, signOut, googleSignIn }),
    [user, profile, plan, loading, signIn, signUp, signOut, googleSignIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
