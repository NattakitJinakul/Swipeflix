/**
 * IGDB fetch wrapper. Base https://api.igdb.com/v4. Requests are POST with an APICALYPSE
 * text body (Content-Type text/plain), authenticated with Client-ID + Bearer token headers.
 */

const BASE = 'https://api.igdb.com/v4';
const CLIENT_ID = process.env.EXPO_PUBLIC_IGDB_CLIENT_ID ?? '';
const TOKEN = process.env.EXPO_PUBLIC_IGDB_TOKEN ?? '';

/** POST an apicalypse body to an IGDB endpoint. Throws on non-ok. */
export async function igdb<T>(path: string, body: string): Promise<T> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: {
      'Client-ID': CLIENT_ID,
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'text/plain',
      Accept: 'application/json',
    },
    body,
  });
  if (!res.ok) throw new Error(`IGDB ${res.status}`);
  return res.json() as Promise<T>;
}

/**
 * Build a full image URL from an IGDB image path (`//images.igdb.com/.../t_thumb/<hash>.jpg`).
 * size: 't_cover_big' (portrait cover), 't_screenshot_big' / 't_720p' (screenshots). Null if no url.
 */
export const igdbImage = (
  url: string | null | undefined,
  size = 't_cover_big',
): string | null => (url ? 'https:' + url.replace('t_thumb', size) : null);
