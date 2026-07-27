/**
 * Settings context: theme / region / language / favoriteGenres + content & accessibility prefs.
 * Source of truth is the user profile doc; mirrored to AsyncStorage for instant load + offline.
 * Writes use setDoc(..., { merge: true }) so they create/patch the profile map without needing
 * the doc to pre-exist and without clobbering sibling fields.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, setDoc } from 'firebase/firestore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { db } from '../firebase/config';
import type { ThemePref } from '../types/user';
import { useAuth } from './auth';

const CACHE_KEY = 'settings:v1';

export type SwipeSensitivity = 'low' | 'med' | 'high';

type SettingsState = {
  theme: ThemePref;
  region: string;
  language: string;
  favoriteGenres: number[];
  // Content + accessibility prefs (docs/10 + docs/11).
  autoplayTrailer: boolean;
  reduceMotion: boolean;
  swipeSensitivity: SwipeSensitivity;
  hideAdult: boolean;
  notifyNew: boolean;
};

const DEFAULTS: SettingsState = {
  theme: 'system',
  region: 'TH',
  language: 'th-TH',
  favoriteGenres: [],
  autoplayTrailer: true,
  reduceMotion: false,
  swipeSensitivity: 'med',
  hideAdult: true,
  notifyNew: false,
};

export type SettingsContextValue = SettingsState & {
  setTheme: (theme: ThemePref) => void;
  setRegion: (region: string) => void;
  setLanguage: (language: string) => void;
  setFavoriteGenres: (genres: number[]) => void;
  setAutoplayTrailer: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setSwipeSensitivity: (v: SwipeSensitivity) => void;
  setHideAdult: (v: boolean) => void;
  setNotifyNew: (v: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const uid = user?.uid ?? null;
  const [state, setState] = useState<SettingsState>(DEFAULTS);

  // 1. Hydrate from AsyncStorage cache on mount.
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(CACHE_KEY)
      .then((raw) => {
        if (active && raw)
          setState((s) => ({ ...s, ...(JSON.parse(raw) as Partial<SettingsState>) }));
      })
      .catch((e) => console.warn('[settings] cache read failed', e));
    return () => {
      active = false;
    };
  }, []);

  // 2. When the profile doc loads, adopt its preferences (merge — keep any cache-only extras).
  useEffect(() => {
    if (!profile) return;
    const p = profile as Partial<SettingsState> & typeof profile;
    setState((prev) => ({
      ...prev,
      theme: p.theme ?? prev.theme,
      region: p.region ?? prev.region,
      language: p.language ?? prev.language,
      favoriteGenres: p.favoriteGenres ?? prev.favoriteGenres,
      autoplayTrailer: p.autoplayTrailer ?? prev.autoplayTrailer,
      reduceMotion: p.reduceMotion ?? prev.reduceMotion,
      swipeSensitivity: p.swipeSensitivity ?? prev.swipeSensitivity,
      hideAdult: p.hideAdult ?? prev.hideAdult,
      notifyNew: p.notifyNew ?? prev.notifyNew,
    }));
  }, [profile]);

  const persist = useCallback(
    (next: SettingsState, field: keyof SettingsState) => {
      void AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next)).catch((e) =>
        console.warn('[settings] cache write failed', e)
      );
      if (uid) {
        // merge:true creates the doc if missing and patches only this profile field.
        void setDoc(
          doc(db, 'users', uid),
          { profile: { [field]: next[field] } },
          { merge: true }
        ).catch((e) => console.warn('[settings] write failed', e));
      }
    },
    [uid]
  );

  const update = useCallback(
    <K extends keyof SettingsState>(field: K, value: SettingsState[K]) => {
      setState((prev) => {
        const next = { ...prev, [field]: value };
        persist(next, field);
        return next;
      });
    },
    [persist]
  );

  const setTheme = useCallback((theme: ThemePref) => update('theme', theme), [update]);
  const setRegion = useCallback((region: string) => update('region', region), [update]);
  const setLanguage = useCallback((language: string) => update('language', language), [update]);
  const setFavoriteGenres = useCallback(
    (genres: number[]) => update('favoriteGenres', genres),
    [update]
  );
  const setAutoplayTrailer = useCallback((v: boolean) => update('autoplayTrailer', v), [update]);
  const setReduceMotion = useCallback((v: boolean) => update('reduceMotion', v), [update]);
  const setSwipeSensitivity = useCallback(
    (v: SwipeSensitivity) => update('swipeSensitivity', v),
    [update]
  );
  const setHideAdult = useCallback((v: boolean) => update('hideAdult', v), [update]);
  const setNotifyNew = useCallback((v: boolean) => update('notifyNew', v), [update]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      setTheme,
      setRegion,
      setLanguage,
      setFavoriteGenres,
      setAutoplayTrailer,
      setReduceMotion,
      setSwipeSensitivity,
      setHideAdult,
      setNotifyNew,
    }),
    [
      state,
      setTheme,
      setRegion,
      setLanguage,
      setFavoriteGenres,
      setAutoplayTrailer,
      setReduceMotion,
      setSwipeSensitivity,
      setHideAdult,
      setNotifyNew,
    ]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
