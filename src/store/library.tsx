/**
 * Library context: liked (อยากเล่น) / played (เล่นแล้ว) / disliked with optimistic local
 * updates + Firestore sync. No signed-in user => in-memory only (never crashes; guest-safe).
 * Undo reverses the last action.
 *
 * Firestore subcollections under the user doc, one per status:
 *   users/{uid}/liked/{gameId}, users/{uid}/played/{gameId}, users/{uid}/disliked/{gameId}
 * liked/played store GameLite; disliked stores just the id.
 * (Firestore CRUD is inlined here.)
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { db } from '../firebase/config';
import type { GameLite } from '../types/game';
import { useAuth } from './auth';

export type GameStatus = 'liked' | 'played' | 'disliked';

/** Where an action originated, so a screen can scope Undo to its own actions. */
export type ActionOrigin = 'deck' | 'detail';

type LastAction = { origin: ActionOrigin } & (
  | { kind: 'like'; game: GameLite }
  | { kind: 'played'; game: GameLite }
  | { kind: 'dislike'; id: number }
  | { kind: 'move'; game: GameLite; from: GameStatus; to: GameStatus }
);

export type LibraryContextValue = {
  liked: GameLite[];
  played: GameLite[];
  disliked: number[];
  loading: boolean;
  like: (game: GameLite, origin?: ActionOrigin) => void;
  dislike: (id: number, origin?: ActionOrigin) => void;
  markPlayed: (game: GameLite, origin?: ActionOrigin) => void;
  remove: (id: number, status: GameStatus) => void;
  moveToPlayed: (game: GameLite) => void;
  undo: () => void;
  canUndo: boolean;
  /** Origin of the last undoable action (null when none). Consumers gate Undo on this. */
  lastActionOrigin: ActionOrigin | null;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

// ---- Firestore helpers (inlined; games, played subcollection) ----

const itemRef = (uid: string, status: GameStatus, id: number | string) =>
  doc(db, 'users', uid, status, String(id));

const addToLibrary = (uid: string, game: GameLite, status: 'liked' | 'played') =>
  setDoc(itemRef(uid, status, game.id), { ...game, addedAt: serverTimestamp() });

const addDisliked = (uid: string, id: number) =>
  setDoc(itemRef(uid, 'disliked', id), { id, at: serverTimestamp() });

const removeFromLibrary = (uid: string, id: number, status: GameStatus) =>
  deleteDoc(itemRef(uid, status, id));

const moveStatus = async (uid: string, game: GameLite, from: GameStatus, to: GameStatus) => {
  await removeFromLibrary(uid, game.id, from);
  if (to === 'disliked') await addDisliked(uid, game.id);
  else await addToLibrary(uid, game, to);
};

const toLite = (data: Record<string, unknown>): GameLite => ({
  id: Number(data.id),
  name: String(data.name ?? ''),
  image: (data.image as string | null) ?? null,
  genre: String(data.genre ?? ''),
  platform: String(data.platform ?? ''),
  year: data.year != null ? Number(data.year) : null,
  rating: data.rating != null ? Number(data.rating) : null,
});

async function fetchLibrary(uid: string) {
  const [likedSnap, playedSnap, dislikedSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'liked')),
    getDocs(collection(db, 'users', uid, 'played')),
    getDocs(collection(db, 'users', uid, 'disliked')),
  ]);
  return {
    liked: likedSnap.docs.map((d) => toLite(d.data())),
    played: playedSnap.docs.map((d) => toLite(d.data())),
    disliked: dislikedSnap.docs.map((d) => Number(d.data().id ?? d.id)),
  };
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [liked, setLiked] = useState<GameLite[]>([]);
  const [played, setPlayed] = useState<GameLite[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [lastActionOrigin, setLastActionOrigin] = useState<ActionOrigin | null>(null);
  const lastAction = useRef<LastAction | null>(null);

  // Load from Firestore on sign-in; clear on sign-out (guest = in-memory).
  useEffect(() => {
    let active = true;
    if (!uid) {
      setLiked([]);
      setPlayed([]);
      setDisliked([]);
      return;
    }
    setLoading(true);
    fetchLibrary(uid)
      .then((snap) => {
        if (!active) return;
        setLiked(snap.liked);
        setPlayed(snap.played);
        setDisliked(snap.disliked);
      })
      .catch((e) => console.warn('[library] load failed', e))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid]);

  const record = (action: LastAction) => {
    lastAction.current = action;
    setCanUndo(true);
    setLastActionOrigin(action.origin);
  };

  const like = useCallback(
    (game: GameLite, origin: ActionOrigin = 'detail') => {
      setLiked((prev) => (prev.some((g) => g.id === game.id) ? prev : [game, ...prev]));
      record({ kind: 'like', game, origin });
      if (uid) void addToLibrary(uid, game, 'liked').catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const markPlayed = useCallback(
    (game: GameLite, origin: ActionOrigin = 'detail') => {
      setPlayed((prev) => (prev.some((g) => g.id === game.id) ? prev : [game, ...prev]));
      record({ kind: 'played', game, origin });
      if (uid) void addToLibrary(uid, game, 'played').catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const dislike = useCallback(
    (id: number, origin: ActionOrigin = 'detail') => {
      setDisliked((prev) => (prev.includes(id) ? prev : [id, ...prev]));
      record({ kind: 'dislike', id, origin });
      if (uid) void addDisliked(uid, id).catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const remove = useCallback(
    (id: number, status: GameStatus) => {
      if (status === 'liked') setLiked((p) => p.filter((g) => g.id !== id));
      else if (status === 'played') setPlayed((p) => p.filter((g) => g.id !== id));
      else setDisliked((p) => p.filter((x) => x !== id));
      if (uid) void removeFromLibrary(uid, id, status).catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const moveToPlayed = useCallback(
    (game: GameLite) => {
      setLiked((p) => p.filter((g) => g.id !== game.id));
      setPlayed((prev) => (prev.some((g) => g.id === game.id) ? prev : [game, ...prev]));
      record({ kind: 'move', game, from: 'liked', to: 'played', origin: 'detail' });
      if (uid) void moveStatus(uid, game, 'liked', 'played').catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const undo = useCallback(() => {
    const action = lastAction.current;
    if (!action) return;
    switch (action.kind) {
      case 'like':
        setLiked((p) => p.filter((g) => g.id !== action.game.id));
        if (uid) void removeFromLibrary(uid, action.game.id, 'liked').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'played':
        setPlayed((p) => p.filter((g) => g.id !== action.game.id));
        if (uid) void removeFromLibrary(uid, action.game.id, 'played').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'dislike':
        setDisliked((p) => p.filter((x) => x !== action.id));
        if (uid) void removeFromLibrary(uid, action.id, 'disliked').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'move':
        setPlayed((p) => p.filter((g) => g.id !== action.game.id));
        setLiked((prev) => (prev.some((g) => g.id === action.game.id) ? prev : [action.game, ...prev]));
        if (uid) void moveStatus(uid, action.game, action.to, action.from).catch((e) => console.warn('[library] write failed', e));
        break;
    }
    lastAction.current = null;
    setCanUndo(false);
    setLastActionOrigin(null);
  }, [uid]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      liked,
      played,
      disliked,
      loading,
      like,
      dislike,
      markPlayed,
      remove,
      moveToPlayed,
      undo,
      canUndo,
      lastActionOrigin,
    }),
    [liked, played, disliked, loading, like, dislike, markPlayed, remove, moveToPlayed, undo, canUndo, lastActionOrigin]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
