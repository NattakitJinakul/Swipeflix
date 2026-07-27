/**
 * TMDB image URL builder. Kept local to components/ so UI stays decoupled from src/.
 * Mirrors src/api/tmdb.ts `img` — see docs/04-tmdb-api.md.
 * `path` is a TMDB *_path value (leading slash) or null.
 */
export type TmdbImageSize = 'w185' | 'w342' | 'w500' | 'w780' | 'original';

const IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function posterUri(
  path: string | null | undefined,
  size: TmdbImageSize = 'w500',
): string | undefined {
  return path ? `${IMAGE_BASE}/${size}${path}` : undefined;
}
