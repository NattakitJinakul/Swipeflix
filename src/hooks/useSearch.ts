/**
 * useSearch — debounced TMDB movie search. Empty/whitespace query yields no results.
 * ~400ms debounce; stale responses are discarded. See docs/02 (Discover) + docs/11.
 */
import { useEffect, useRef, useState } from 'react';

import { searchMovies } from '../api/endpoints';
import type { MovieLite } from '../types/movie';

const DEBOUNCE_MS = 400;

export type UseSearch = {
  query: string;
  setQuery: (q: string) => void;
  results: MovieLite[];
  loading: boolean;
};

export function useSearch(): UseSearch {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MovieLite[]>([]);
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
      searchMovies(trimmed)
        .then((paged) => {
          if (my === reqId.current) setResults(paged.results);
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
