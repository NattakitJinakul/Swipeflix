/**
 * useDeck — swipe deck loader. FreeToGame has NO server pagination, so we fetch the full
 * (sort-ordered, platform-filtered) list ONCE per source/filter, filter by category + seen-ids
 * CLIENT-SIDE, then page the deck client-side. Keeps the movie build's public shape and the
 * error-vs-exhausted separation. exhausted = whole fetched list shown; error = fetch failed.
 */
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { allGames, type Sort } from '../api/endpoints';
import { useLibrary } from '../store/library';
import { useSettings } from '../store/settings';
import type { GameLite } from '../types/game';
import { slugifyGenre } from '../utils/genres';

export type DeckSource = 'popular' | 'new' | 'relevance' | 'for_you';

export type DeckFilters = {
  categories: string[];
  platform?: 'pc' | 'browser' | 'all';
};

const SORT: Record<DeckSource, Sort> = {
  popular: 'popularity',
  new: 'release-date',
  relevance: 'relevance',
  for_you: 'popularity',
};

// How many cards to reveal per client-side page.
const PAGE_SIZE = 10;

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
  /** Whole fetched list shown. NOT a fetch failure — see `error`. */
  exhausted: boolean;
  /** Last fetch failed (offline). Show a retry state, not "seen everything". */
  error: boolean;
  source: DeckSource;
  setSource: (s: DeckSource) => void;
  filters: DeckFilters;
  setFilters: (f: DeckFilters) => void;
};

export function useDeck(): UseDeck {
  const { liked, played, disliked } = useLibrary();
  const { favoriteGenres } = useSettings();

  const [source, setSourceState] = useState<DeckSource>('popular');
  const [filters, setFiltersState] = useState<DeckFilters>({ categories: [] });

  // Full fetched list (unfiltered by seen-ids); the deck is a client-side window over it.
  const [pool, setPool] = useState<GameLite[]>([]);
  const [shown, setShown] = useState(0); // how many of the eligible pool are in the deck
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const reqId = useRef(0); // guards against out-of-order responses after reload

  const excluded = useMemo(
    () => new Set<number>([...liked.map((g) => g.id), ...played.map((g) => g.id), ...disliked]),
    [liked, played, disliked],
  );

  // Category set for this source/filter (explicit filter wins; else favorites for "for_you").
  const activeCategories = useMemo(() => {
    const cats = filters.categories.length ? filters.categories : source === 'for_you' ? favoriteGenres : [];
    return new Set(cats);
  }, [filters.categories, source, favoriteGenres]);

  // Eligible = pool minus seen-ids, minus category-mismatch.
  const eligible = useMemo(
    () =>
      pool.filter(
        (g) =>
          !excluded.has(g.id) &&
          (activeCategories.size === 0 || activeCategories.has(slugifyGenre(g.genre))),
      ),
    [pool, excluded, activeCategories],
  );

  const deck = useMemo(() => eligible.slice(0, shown), [eligible, shown]);
  const exhausted = !loading && !error && shown >= eligible.length && index >= eligible.length;

  const fetchPool = useCallback(async () => {
    const my = ++reqId.current;
    setLoading(true);
    setError(false);
    try {
      const list = await allGames({ sort: SORT[source], platform: filters.platform });
      if (my !== reqId.current) return;
      setPool(list);
    } catch {
      if (my === reqId.current) setError(true);
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, [source, filters.platform]);

  // Refetch the pool when source or platform changes; reset the cursor/window.
  useEffect(() => {
    setIndex(0);
    setShown(PAGE_SIZE);
    setPool([]);
    void fetchPool();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, filters.platform]);

  // Category filter changes don't need a refetch (client-side) — just reset the window.
  useEffect(() => {
    setIndex(0);
    setShown(PAGE_SIZE);
  }, [filters.categories, favoriteGenres]);

  // Prefetch the next couple of covers for smooth reveal (FreeToGame thumbnails are full URLs).
  useEffect(() => {
    for (const g of deck.slice(index + 1, index + 3)) {
      if (g.image) void Image.prefetch(g.image);
    }
  }, [deck, index]);

  const loadMore = useCallback(() => {
    if (loading || error) return;
    setShown((s) => (s >= eligible.length ? s : s + PAGE_SIZE));
  }, [loading, error, eligible.length]);

  // Auto top-up the client window when the cursor nears the end of the loaded deck.
  useEffect(() => {
    if (deck.length - index <= 3 && shown < eligible.length && !loading && !error) loadMore();
  }, [index, deck.length, shown, eligible.length, loading, error, loadMore]);

  const advance = useCallback(() => setIndex((i) => i + 1), []);
  const rewind = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);

  const setSource = useCallback((s: DeckSource) => setSourceState(s), []);
  const setFilters = useCallback((f: DeckFilters) => setFiltersState(f), []);
  const reload = useCallback(() => {
    setIndex(0);
    setShown(PAGE_SIZE);
    setError(false);
    void fetchPool();
  }, [fetchPool]);

  const retry = useCallback(() => {
    setError(false);
    void fetchPool();
  }, [fetchPool]);

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
