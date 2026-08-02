/**
 * useSearch — debounced RAWG game search. Empty/whitespace query yields no results.
 * ~400ms debounce; stale responses are discarded. See docs/02 (Discover) + docs/11.
 */
import { useEffect, useRef, useState } from 'react';

import { searchGames } from '../api/endpoints';
import type { GameLite } from '../types/game';

const DEBOUNCE_MS = 400;

export type UseSearch = {
  query: string;
  setQuery: (q: string) => void;
  results: GameLite[];
  loading: boolean;
};

export function useSearch(): UseSearch {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameLite[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const my = ++reqId.current;
    const timer = setTimeout(() => {
      searchGames(trimmed)
        .then((games) => {
          if (my === reqId.current) setResults(games);
        })
        .catch(() => {
          if (my === reqId.current) setResults([]);
        })
        .finally(() => {
          if (my === reqId.current) setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  return { query, setQuery, results, loading };
}
