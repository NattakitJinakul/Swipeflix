/**
 * useDeck — swipe deck loader. Pulls TMDB pages by source (trending / top rated /
 * now playing / for-you), applies filters (genre · year · minRating), drops ids the
 * user has already liked/watched/disliked, dedups, and prefetches upcoming posters.
 * Owns a forward cursor (index/current/advance/rewind). See docs/02 + docs/11.
 */
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { discoverMovies, trending, type DiscoverOptions } from '../api/endpoints';
import { useLibrary } from '../store/library';
import { useSettings } from '../store/settings';
import type { MovieLite } from '../types/movie';

export type DeckSource = 'trending' | 'top_rated' | 'now_playing' | 'for_you';

export type DeckFilters = {
  genres: number[];
  year?: number;
  minRating?: number;
  /** Max runtime in minutes. UI-only hint — TMDB list rows carry no runtime, so it is not enforced on the deck. */
  maxRuntime?: number;
};

const SORT_BY: Record<DeckSource, string> = {
  trending: 'popularity.desc',
  top_rated: 'vote_average.desc',
  now_playing: 'primary_release_date.desc',
  for_you: 'popularity.desc',
};

const POSTER_URL = (path: string | null): string | null =>
  path ? `https://image.tmdb.org/t/p/w500${path}` : null;

export type UseDeck = {
  deck: MovieLite[];
  index: number;
  current: MovieLite | undefined;
  advance: () => void;
  rewind: () => void;
  loadMore: () => void;
  reload: () => void;
  retry: () => void;
  loading: boolean;
  /** No more results from the source (a page came back empty). NOT a fetch failure — see `error`. */
  exhausted: boolean;
  /** Last fetch failed (bad/placeholder token, offline). Show a retry state, not "seen everything". */
  error: boolean;
  source: DeckSource;
  setSource: (s: DeckSource) => void;
  filters: DeckFilters;
  setFilters: (f: DeckFilters) => void;
};

export function useDeck(): UseDeck {
  const { liked, watched, disliked } = useLibrary();
  const { favoriteGenres, language, region } = useSettings();

  const [source, setSourceState] = useState<DeckSource>('trending');
  const [filters, setFiltersState] = useState<DeckFilters>({ genres: [] });

  const [deck, setDeck] = useState<MovieLite[]>([]);
  const [index, setIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [error, setError] = useState(false);

  // ids already in the deck (avoid dupes across pages); ref so fetch closure stays stable.
  const deckIds = useRef<Set<number>>(new Set());
  const reqId = useRef(0); // guards against out-of-order responses after reload
  const lastAttempt = useRef<{ page: number; replace: boolean }>({ page: 1, replace: true });

  const excluded = useMemo(
    () => new Set<number>([...liked.map((m) => m.id), ...watched.map((m) => m.id), ...disliked]),
    [liked, watched, disliked],
  );

  const fetchPage = useCallback(
    async (nextPage: number): Promise<MovieLite[]> => {
      const effectiveGenres =
        filters.genres.length > 0
          ? filters.genres
          : source === 'for_you'
            ? favoriteGenres
            : [];

      // Fresh trending uses the dedicated endpoint (no paging); everything else via discover.
      if (source === 'trending' && nextPage === 1 && effectiveGenres.length === 0 && !filters.year) {
        return (await trending('week')).results;
      }

      const opts: DiscoverOptions = {
        page: nextPage,
        sortBy: SORT_BY[source],
        language,
        region,
      };
      if (effectiveGenres.length) opts.genres = effectiveGenres;
      if (filters.year) opts.year = filters.year;
      if (filters.minRating != null) opts.minRating = filters.minRating;
      return (await discoverMovies(opts)).results;
    },
    [source, filters, favoriteGenres, language, region],
  );

  // Accumulate at least this many fresh (not-yet-seen) cards per load, paging forward as needed,
  // but never fetch more than MAX_PAGES_PER_LOAD pages in one call (runaway guard for all-excluded pages).
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
        const collected: MovieLite[] = [];
        let pageCursor = startPage;
        let lastGood = startPage - 1;
        let emptied = false;
        for (let i = 0; i < MAX_PAGES_PER_LOAD; i++) {
          const results = await fetchPage(pageCursor);
          if (my !== reqId.current) return; // superseded by a newer reload
          lastGood = pageCursor;
          if (results.length === 0) {
            emptied = true;
            break;
          }
          const fresh = results.filter(
            (m) => !excluded.has(m.id) && !deckIds.current.has(m.id),
          );
          fresh.forEach((m) => deckIds.current.add(m.id));
          collected.push(...fresh);
          pageCursor += 1;
          if (collected.length >= MIN_FRESH) break;
        }
        if (my !== reqId.current) return;
        setDeck((prev) => (replace ? collected : [...prev, ...collected]));
        setPage(lastGood);
        // exhausted ONLY means the source ran out (an empty page), never a fetch failure.
        setExhausted(emptied);
      } catch {
        if (my === reqId.current) setError(true);
      } finally {
        if (my === reqId.current) setLoading(false);
      }
    },
    [fetchPage, excluded],
  );

  // (Re)load page 1 whenever the source or filters change.
  useEffect(() => {
    setIndex(0);
    setDeck([]);
    setExhausted(false);
    void load(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, filters]);

  // Prefetch the next couple of posters for smooth reveal.
  useEffect(() => {
    for (const m of deck.slice(index + 1, index + 3)) {
      const url = POSTER_URL(m.poster);
      if (url) void Image.prefetch(url);
    }
  }, [deck, index]);

  const loadMore = useCallback(() => {
    if (loading || exhausted || error) return;
    void load(page + 1, false);
  }, [loading, exhausted, error, page, load]);

  // Auto top-up when the cursor nears the end of the loaded deck.
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
    void load(1, true);
  }, [load]);

  // Retry the exact fetch that failed (keeps deck position); clears the error first.
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
