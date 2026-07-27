/**
 * TMDB fetch wrapper. See docs/04-tmdb-api.md.
 * Reads process.env.EXPO_PUBLIC_TMDB_TOKEN (v4 Bearer read-access token).
 */

const BASE = 'https://api.themoviedb.org/3';
const TOKEN = process.env.EXPO_PUBLIC_TMDB_TOKEN!;

export type TmdbParams = Record<string, string | number>;

export async function tmdb<T>(path: string, params: TmdbParams = {}): Promise<T> {
  const url = new URL(BASE + path);
  Object.entries({ language: 'th-TH', ...params }).forEach(([k, v]) =>
    url.searchParams.set(k, String(v))
  );
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}`, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

/** Build an image URL from a TMDB path. size: poster w500, backdrop w780/original, profile w185. */
export const img = (path: string | null, size = 'w500'): string | null =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
