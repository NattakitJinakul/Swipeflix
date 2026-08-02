/**
 * useDeck — swipe deck loader. IGDB has server-side pagination (limit/offset), so we page the
 * source server-side (offset = page*20), accumulate not-yet-seen cards, and keep the movie
 * build's public shape + error-vs-exhausted separation + runaway guard.
 */
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { discoverGames, type DeckSort, type DiscoverOptions } from '../api/endpoints';
import { useLibrary } from '../store/library';
import { useSettings } from '../store/settings';
import type { GameLite } from '../types/game';
import { genreIds as toGenreIds } from '../utils/genres';

/** Fisher–Yates shuffle (new array) so the deck order varies each session. */
function shuffle<T>(arr: T[]): T[] {
  const r = [...arr];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

export type DeckSource = 'popular' | 'new' | 'top_rated' | 'for_you';

export type DeckFilters = {
  /** Selected IGDB genre names (also used server-side via name->id). */
  genres: string[];
};

export type UseDeck = {
  deck: GameLite[];
  index: number;
  current: GameLite | undefined;
  advance: () => void;
  rewind: () => void;
  loadMore: () => void;
  reload: () => void;
  retry: () => void;
  loading: boolean;
  /** Source ran out (an empty page). NOT a fetch failure — see `error`. */
  exhausted: boolean;
  /** Last fetch failed (bad token, offline). Show a retry state, not "seen everything". */
  error: boolean;
  source: DeckSource;
  setSource: (s: DeckSource) => void;
  filters: DeckFilters;
  setFilters: (f: DeckFilters) => void;
};

export function useDeck(): UseDeck {
  const { liked, played, disliked, loading: libLoading } = useLibrary();
  const { favoriteGenres } = useSettings();

  const [source, setSourceState] = useState<DeckSource>('popular');
  const [filters, setFiltersState] = useState<DeckFilters>({ genres: [] });

  const [deck, setDeck] = useState<GameLite[]>([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(0); // 0-based
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState(false);

  const deckIds = useRef<Set<number>>(new Set());
  const reqId = useRef(0);
  const lastAttempt = useRef<{ page: number; replace: boolean }>({ page: 0, replace: true });

  const excluded = useMemo(
    () => new Set<number>([...liked.map((g) => g.id), ...played.map((g) => g.id), ...disliked]),
    [liked, played, disliked],
  );

  const fetchPage = useCallback(
    async (nextPage: number): Promise<{ results: GameLite[]; hasMore: boolean }> => {
      const genreNames =
        filters.genres.length > 0 ? filters.genres : source === 'for_you' ? favoriteGenres : [];
      const opts: DiscoverOptions = { page: nextPage, sort: source as DeckSort };
      const ids = toGenreIds(genreNames);
      if (ids.length) opts.genreIds = ids;
      const paged = await discoverGames(opts);
      // Shuffle each page so the deck isn't a fixed sorted list every time.
      return { results: shuffle(paged.results), hasMore: paged.hasMore };
    },
    [source, filters, favoriteGenres],
  );

  const MIN_FRESH = 5;
  const MAX_PAGES_PER_LOAD = 5;

  const load = useCallback(
    async (startPage: number, replace: boolean) => {
      const my = ++reqId.current;
      lastAttempt.current = { page: startPage, replace };
      setLoading(true);
      setError(false);
      try {
        if (replace) deckIds.current = new Set();
        const collected: GameLite[] = [];
        let pageCursor = startPage;
        let lastGood = startPage - 1;
        let ended = false;
        for (let i = 0; i < MAX_PAGES_PER_LOAD; i++) {
          const { results, hasMore } = await fetchPage(pageCursor);
          if (my !== reqId.current) return;
          lastGood = pageCursor;
          if (results.length === 0) {
            ended = true;
            break;
          }
          const fresh = results.filter((g) => !excluded.has(g.id) && !deckIds.current.has(g.id));
          fresh.forEach((g) => deckIds.current.add(g.id));
          collected.push(...fresh);
          pageCursor += 1;
          if (!hasMore) {
            ended = true;
            break;
          }
          if (collected.length >= MIN_FRESH) break;
        }
        if (my !== reqId.current) return;
        setDeck((prev) => (replace ? collected : [...prev, ...collected]));
        setPage(lastGood);
        setExhausted(ended);
      } catch {
        if (my === reqId.current) setError(true);
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    },
    [fetchPage, excluded],
  );

  // (Re)load page 0 whenever the source/filters change — but WAIT for the library to finish
  // loading first, so a signed-in user's already-swiped games are excluded from the very first
  // deck (no race where seen games flash in before Firestore hydrates `excluded`).
  useEffect(() => {
    if (libLoading) return;
    setIndex(0);
    setDeck([]);
    setExhausted(false);
    void load(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, filters, libLoading]);

  // Prefetch the next couple of covers for a smooth reveal (URLs are already absolute).
  useEffect(() => {
    for (const g of deck.slice(index + 1, index + 3)) {
      if (g.image) void Image.prefetch(g.image);
    }
  }, [deck, index]);

  const loadMore = useCallback(() => {
    if (loading || exhausted || error) return;
    void load(page + 1, false);
  }, [loading, exhausted, error, page, load]);

  useEffect(() => {
    if (deck.length - index <= 3 && !loading && !exhausted && !error) loadMore();
  }, [index, deck.length, loading, exhausted, error, loadMore]);

  const advance = useCallback(() => setIndex((i) => i + 1), []);
  const rewind = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const setSource = useCallback((s: DeckSource) => setSourceState(s), []);
  const setFilters = useCallback((f: DeckFilters) => setFiltersState(f), []);
  const reload = useCallback(() => {
    setIndex(0);
    setDeck([]);
    setExhausted(false);
    setError(false);
    void load(0, true);
  }, [load]);

  const retry = useCallback(() => {
    const { page: p, replace } = lastAttempt.current;
    setError(false);
    void load(p, replace);
  }, [load]);

  return {
    deck,
    index,
    current: deck[index],
    advance,
    rewind,
    loadMore,
    reload,
    retry,
    loading,
    exhausted,
    error,
    source,
    setSource,
    filters,
    setFilters,
  };
}
