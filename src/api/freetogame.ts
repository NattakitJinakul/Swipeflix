/**
 * FreeToGame fetch wrapper. Base https://www.freetogame.com/api. NO key required.
 * Throws on non-ok so callers can surface an error state.
 */

const BASE = 'https://www.freetogame.com/api';

export type FtgParams = Record<string, string | number>;

export async function ftg<T>(path: string, params: FtgParams = {}): Promise<T> {
  const url = new URL(BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)));
  const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`FreeToGame ${res.status}`);
  return res.json() as Promise<T>;
}
