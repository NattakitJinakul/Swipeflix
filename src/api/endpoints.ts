/**
 * Typed FreeToGame endpoint functions + raw->app mapping.
 * NO pagination — /games returns the full array; paging is done client-side (see useDeck).
 */
import { ftg, type FtgParams } from './freetogame';
import { CATEGORIES, slugifyGenre } from '../utils/genres';
import type { FtgGame, FtgGameDetail, GameDetail, GameLite } from '../types/game';

const yearOf = (released: string | null | undefined): number | null => {
  if (!released) return null;
  const y = Number(released.slice(0, 4));
  return Number.isFinite(y) && y > 0 ? y : null;
};

export function toGameLite(r: FtgGame): GameLite {
  return {
    id: r.id,
    name: r.title,
    image: r.thumbnail ?? null,
    genre: r.genre ?? '',
    platform: r.platform ?? '',
    year: yearOf(r.release_date),
  };
}

// ---- Lists ----

export type Sort = 'popularity' | 'release-date' | 'alphabetical' | 'relevance';

export type AllGamesOpts = {
  sort?: Sort;
  category?: string;
  platform?: 'pc' | 'browser' | 'all';
};

/** GET /games -> full GameLite[] (no pagination). Optional single category/platform server filter. */
export async function allGames(opts: AllGamesOpts = {}): Promise<GameLite[]> {
  const params: FtgParams = {};
  if (opts.sort) params['sort-by'] = opts.sort;
  if (opts.category) params.category = opts.category;
  if (opts.platform) params.platform = opts.platform;
  const raw = await ftg<FtgGame[]>('/games', params);
  return (Array.isArray(raw) ? raw : []).map(toGameLite);
}

// Back-compat exported names (adapted to FreeToGame — all return GameLite[]).
export const discoverGames = allGames;
export const popularGames = (): Promise<GameLite[]> => allGames({ sort: 'popularity' });
export const newGames = (): Promise<GameLite[]> => allGames({ sort: 'release-date' });
export const topRatedGames = (): Promise<GameLite[]> => allGames({ sort: 'relevance' });

/** No search param on FreeToGame — fetch then filter title client-side. */
export async function searchGames(query: string): Promise<GameLite[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const games = await allGames({ sort: 'popularity' });
  return games.filter((g) => g.name.toLowerCase().includes(q));
}

// ---- Categories ----

/** Static FreeToGame category slugs. */
export const categoryList = (): string[] => CATEGORIES;

// ---- Detail ----

export async function gameDetail(id: number): Promise<GameDetail> {
  const raw = await ftg<FtgGameDetail>('/game', { id });
  const lite = toGameLite(raw);

  // Related = same-genre list minus self (best-effort; empty on failure).
  const related = await allGames({ category: slugifyGenre(raw.genre) })
    .then((list) => list.filter((g) => g.id !== raw.id).slice(0, 12))
    .catch(() => [] as GameLite[]);

  const sr = raw.minimum_system_requirements;
  const sysReq =
    sr && (sr.os || sr.processor || sr.memory || sr.graphics || sr.storage)
      ? {
          os: sr.os,
          processor: sr.processor,
          memory: sr.memory,
          graphics: sr.graphics,
          storage: sr.storage,
        }
      : null;

  return {
    ...lite,
    description: raw.description ?? raw.short_description ?? '',
    shortDescription: raw.short_description ?? '',
    developer: raw.developer ?? '',
    publisher: raw.publisher ?? '',
    releaseDate: raw.release_date && raw.release_date !== '0000-00-00' ? raw.release_date : null,
    gameUrl: raw.game_url ?? '',
    sysReq,
    screenshots: (raw.screenshots ?? []).map((s) => s.image).filter(Boolean),
    related,
  };
}
