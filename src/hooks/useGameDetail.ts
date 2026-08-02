/**
 * useGameDetail — fetch a game's full detail from IGDB + mapped relations.
 * Surfaces summary, studios, genres, platforms, screenshots, YouTube trailer id,
 * websites (store/official links), rating, release year, and similar games.
 */
import { useCallback, useEffect, useState } from 'react';

import { gameDetail } from '../api/endpoints';
import type { GameDetail, GameLite } from '../types/game';

export type UseGameDetail = {
  detail: GameDetail | null;
  loading: boolean;
  error: boolean;
  summary: string;
  developers: string[];
  publishers: string[];
  genres: string[];
  platforms: string[];
  screenshots: string[];
  trailerYoutubeId: string | null;
  websites: { url: string; category: number }[];
  similar: GameLite[];
  releaseYear: number | null;
  rating: number | null;
  reload: () => void;
};

export function useGameDetail(id: number | null): UseGameDetail {
  const [detail, setDetail] = useState<GameDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (id == null) return;
    let active = true;
    setLoading(true);
    setError(false);
    (async () => {
      try {
        const d = await gameDetail(id);
        if (!active) return;
        setDetail(d);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, nonce]);

  return {
    detail,
    loading,
    error,
    summary: detail?.summary ?? '',
    developers: detail?.developers ?? [],
    publishers: detail?.publishers ?? [],
    genres: detail?.genres ?? [],
    platforms: detail?.platforms ?? [],
    screenshots: detail?.screenshots ?? [],
    trailerYoutubeId: detail?.trailerYoutubeId ?? null,
    websites: detail?.websites ?? [],
    similar: detail?.similar ?? [],
    releaseYear: detail?.year ?? null,
    rating: detail?.rating ?? null,
    reload,
  };
}
