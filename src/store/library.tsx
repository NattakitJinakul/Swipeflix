/**
 * Library context: liked / watched / disliked with optimistic local updates + Firestore sync.
 * No signed-in user => in-memory only (never crashes). Undo reverses the last action.
 */
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
import {
  addDisliked,
  addToLibrary,
  fetchLibrary,
  moveStatus,
  removeFromLibrary,
  type MovieStatus,
} from '../firebase/library';
import type { MovieLite } from '../types/movie';
import { useAuth } from './auth';

/** Where an action originated, so a screen can scope Undo to its own actions. */
export type ActionOrigin = 'deck' | 'detail';

type LastAction = { origin: ActionOrigin } & (
  | { kind: 'like'; movie: MovieLite }
  | { kind: 'watched'; movie: MovieLite }
  | { kind: 'dislike'; id: number }
  | { kind: 'move'; movie: MovieLite; from: MovieStatus; to: MovieStatus }
);

export type LibraryContextValue = {
  liked: MovieLite[];
  watched: MovieLite[];
  disliked: number[];
  loading: boolean;
  like: (movie: MovieLite, origin?: ActionOrigin) => void;
  dislike: (id: number, origin?: ActionOrigin) => void;
  markWatched: (movie: MovieLite, origin?: ActionOrigin) => void;
  remove: (id: number, status: MovieStatus) => void;
  moveToWatched: (movie: MovieLite) => void;
  undo: () => void;
  canUndo: boolean;
  /** Origin of the last undoable action (null when none). Consumers gate Undo on this. */
  lastActionOrigin: ActionOrigin | null;
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const uid = user?.uid ?? null;

  const [liked, setLiked] = useState<MovieLite[]>([]);
  const [watched, setWatched] = useState<MovieLite[]>([]);
  const [disliked, setDisliked] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [lastActionOrigin, setLastActionOrigin] = useState<ActionOrigin | null>(null);
  const lastAction = useRef<LastAction | null>(null);

  // Load from Firestore on sign-in; clear on sign-out.
  useEffect(() => {
    let active = true;
    if (!uid) {
      setLiked([]);
      setWatched([]);
      setDisliked([]);
      return;
    }
    setLoading(true);
    fetchLibrary(uid)
      .then((snap) => {
        if (!active) return;
        setLiked(snap.liked);
        setWatched(snap.watched);
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
    (movie: MovieLite, origin: ActionOrigin = 'detail') => {
      setLiked((prev) =>
        prev.some((m) => m.id === movie.id) ? prev : [movie, ...prev]
      );
      record({ kind: 'like', movie, origin });
      if (uid) void addToLibrary(uid, movie, 'liked').catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const markWatched = useCallback(
    (movie: MovieLite, origin: ActionOrigin = 'detail') => {
      setWatched((prev) =>
        prev.some((m) => m.id === movie.id) ? prev : [movie, ...prev]
      );
      record({ kind: 'watched', movie, origin });
      if (uid) void addToLibrary(uid, movie, 'watched').catch((e) => console.warn('[library] write failed', e));
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
    (id: number, status: MovieStatus) => {
      if (status === 'liked') setLiked((p) => p.filter((m) => m.id !== id));
      else if (status === 'watched') setWatched((p) => p.filter((m) => m.id !== id));
      else setDisliked((p) => p.filter((x) => x !== id));
      if (uid) void removeFromLibrary(uid, id, status).catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const moveToWatched = useCallback(
    (movie: MovieLite) => {
      setLiked((p) => p.filter((m) => m.id !== movie.id));
      setWatched((prev) =>
        prev.some((m) => m.id === movie.id) ? prev : [movie, ...prev]
      );
      record({ kind: 'move', movie, from: 'liked', to: 'watched', origin: 'detail' });
      if (uid) void moveStatus(uid, movie, 'liked', 'watched').catch((e) => console.warn('[library] write failed', e));
    },
    [uid]
  );

  const undo = useCallback(() => {
    const action = lastAction.current;
    if (!action) return;
    switch (action.kind) {
      case 'like':
        setLiked((p) => p.filter((m) => m.id !== action.movie.id));
        if (uid) void removeFromLibrary(uid, action.movie.id, 'liked').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'watched':
        setWatched((p) => p.filter((m) => m.id !== action.movie.id));
        if (uid) void removeFromLibrary(uid, action.movie.id, 'watched').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'dislike':
        setDisliked((p) => p.filter((x) => x !== action.id));
        if (uid) void removeFromLibrary(uid, action.id, 'disliked').catch((e) => console.warn('[library] write failed', e));
        break;
      case 'move':
        setWatched((p) => p.filter((m) => m.id !== action.movie.id));
        setLiked((prev) =>
          prev.some((m) => m.id === action.movie.id) ? prev : [action.movie, ...prev]
        );
        if (uid)
          void moveStatus(uid, action.movie, action.to, action.from).catch((e) => console.warn('[library] write failed', e));
        break;
    }
    lastAction.current = null;
    setCanUndo(false);
    setLastActionOrigin(null);
  }, [uid]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      liked,
      watched,
      disliked,
      loading,
      like,
      dislike,
      markWatched,
      remove,
      moveToWatched,
      undo,
      canUndo,
      lastActionOrigin,
    }),
    [liked, watched, disliked, loading, like, dislike, markWatched, remove, moveToWatched, undo, canUndo, lastActionOrigin]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error('useLibrary must be used within LibraryProvider');
  return ctx;
}
