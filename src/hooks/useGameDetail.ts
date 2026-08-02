/**
 * useGameDetail — fetch a game's full detail from FreeToGame (/game?id=) + related list.
 * No trailers/stores/rating on FreeToGame. Surfaces description, studios, sys req,
 * screenshots, gameUrl, and same-genre related games.
 */
import { useCallback, useEffect, useState } from 'react';

import { gameDetail } from '../api/endpoints';
import type { GameDetail, GameLite } from '../types/game';

export type UseGameDetail = {
  detail: GameDetail | null;
  loading: boolean;
  error: boolean;
  description: string;
  developer: string;
  publisher: string;
  platform: string;
  genre: string;
  releaseYear: number | null;
  gameUrl: string;
  sysReq: GameDetail['sysReq'];
  screenshots: string[];
  related: GameLite[];
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
    description: detail?.description ?? '',
    developer: detail?.developer ?? '',
    publisher: detail?.publisher ?? '',
    platform: detail?.platform ?? '',
    genre: detail?.genre ?? '',
    releaseYear: detail?.year ?? null,
    gameUrl: detail?.gameUrl ?? '',
    sysReq: detail?.sysReq ?? null,
    screenshots: detail?.screenshots ?? [],
    related: detail?.related ?? [],
    reload,
  };
}
