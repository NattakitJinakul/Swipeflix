/**
 * useMovieDetail — fetch a movie's full detail (append_to_response) in the user's language.
 * Overview arrives with the detail; only when it is blank (and the locale isn't English) does it
 * make ONE extra en-US overview fetch via englishOverview(). Derives director, cast, trailer key,
 * watch providers, recommendations, and a formatted runtime. See docs/04 + docs/02.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';

import { englishOverview, movieDetail } from '../api/endpoints';
import { useSettings } from '../store/settings';
import type { CastMember, CrewMember, MovieDetail, MovieLite, WatchProvider } from '../types/movie';

/** Minutes -> "2h35m" / "48m". */
export function formatRuntime(runtime: number | null): string | null {
  if (!runtime || runtime <= 0) return null;
  const h = Math.floor(runtime / 60);
  const m = runtime % 60;
  return h > 0 ? `${h}h${m > 0 ? `${m}m` : ''}` : `${m}m`;
}

/** Best YouTube trailer key: official Trailer > any Trailer > Teaser > first YouTube video. */
function pickTrailerKey(detail: MovieDetail): string | null {
  const yt = detail.videos.filter((v) => v.site === 'YouTube');
  if (!yt.length) return null;
  const byPref =
    yt.find((v) => v.type === 'Trailer' && v.official) ??
    yt.find((v) => v.type === 'Trailer') ??
    yt.find((v) => v.type === 'Teaser') ??
    yt[0];
  return byPref?.key ?? null;
}

export type UseMovieDetail = {
  detail: MovieDetail | null;
  loading: boolean;
  error: boolean;
  overview: string;
  overviewFallback: boolean;
  director: CrewMember | null;
  cast: CastMember[];
  trailerKey: string | null;
  providers: WatchProvider[];
  recommendations: MovieLite[];
  runtimeLabel: string | null;
  backdrops: string[];
  reload: () => void;
};

export function useMovieDetail(id: number | null): UseMovieDetail {
  const { language, region } = useSettings();

  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [overview, setOverview] = useState('');
  const [overviewFallback, setOverviewFallback] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (id == null) return;
    let active = true;
    setLoading(true);
    setError(false);
    // Single detail fetch — overview already arrives via append_to_response.
    // Only when it is blank (and the user's language isn't English) do we make ONE extra en-US fetch.
    (async () => {
      try {
        const d = await movieDetail(id, language, region);
        if (!active) return;
        setDetail(d);
        if (d.overview?.trim()) {
          setOverview(d.overview);
          setOverviewFallback(false);
        } else if (language && !language.toLowerCase().startsWith('en')) {
          const enText = await englishOverview(id).catch(() => '');
          if (!active) return;
          setOverview(enText);
          setOverviewFallback(enText.trim().length > 0);
        } else {
          setOverview('');
          setOverviewFallback(false);
        }
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id, language, region, nonce]);

  const trailerKey = useMemo(() => (detail ? pickTrailerKey(detail) : null), [detail]);
  const runtimeLabel = useMemo(() => formatRuntime(detail?.runtime ?? null), [detail]);

  return {
    detail,
    loading,
    error,
    overview,
    overviewFallback,
    director: detail?.director ?? null,
    cast: detail?.cast ?? [],
    trailerKey,
    providers: detail?.watchProviders ?? [],
    recommendations: detail?.recommendations ?? [],
    runtimeLabel,
    backdrops: detail?.backdrops ?? [],
    reload,
  };
}
