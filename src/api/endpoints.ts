/**
 * Typed IGDB endpoint functions + raw->app mapping (apicalypse bodies).
 * Server-side pagination via `limit 20; offset page*20;` (page is 0-based).
 */
import { igdb, igdbImage } from './igdb';
import type {
  GameDetail,
  GameLite,
  IgdbGame,
  IgdbGameDetail,
} from '../types/game';

const LIST_FIELDS =
  'fields name, cover.url, rating, rating_count, first_release_date, genres.name, platforms.name;';

const yearOf = (epochSec: number | null | undefined): number | null =>
  epochSec ? new Date(epochSec * 1000).getFullYear() : null;

export function toGameLite(r: IgdbGame): GameLite {
  return {
    id: r.id,
    name: r.name,
    image: igdbImage(r.cover?.url ?? null, 't_720p'),
    genre: r.genres?.[0]?.name ?? '',
    platform: r.platforms?.[0]?.name ?? '',
    year: yearOf(r.first_release_date),
    rating: r.rating ?? null,
  };
}

export type PagedLite = { page: number; hasMore: boolean; results: GameLite[] };

const PAGE_SIZE = 20;

export type DeckSort = 'popular' | 'new' | 'top_rated' | 'for_you';

export type DiscoverOptions = {
  page?: number; // 0-based
  sort?: DeckSort;
  genreIds?: number[];
};

/** Build the apicalypse body for a list query. */
function listBody(opts: DiscoverOptions): string {
  const page = opts.page ?? 0;
  const sort = opts.sort ?? 'popular';
  const where: string[] = ['cover != null'];
  let order = 'sort rating_count desc;';

  switch (sort) {
    case 'top_rated':
      where.push('rating_count > 30');
      order = 'sort rating desc;';
      break;
    case 'new': {
      const now = Math.floor(Date.now() / 1000);
      where.push('first_release_date != null', `first_release_date < ${now}`);
      order = 'sort first_release_date desc;';
      break;
    }
    case 'popular':
    case 'for_you':
    default:
      where.push('rating_count > 10');
      order = 'sort rating_count desc;';
      break;
  }

  if (opts.genreIds?.length) where.push(`genres = (${opts.genreIds.join(',')})`);

  return [
    LIST_FIELDS,
    `where ${where.join(' & ')};`,
    order,
    `limit ${PAGE_SIZE};`,
    `offset ${page * PAGE_SIZE};`,
  ].join(' ');
}

export async function discoverGames(opts: DiscoverOptions = {}): Promise<PagedLite> {
  const page = opts.page ?? 0;
  const raw = await igdb<IgdbGame[]>('/games', listBody(opts));
  const results = (Array.isArray(raw) ? raw : []).map(toGameLite);
  return { page, hasMore: results.length >= PAGE_SIZE, results };
}

export const popularGames = (page = 0): Promise<PagedLite> =>
  discoverGames({ page, sort: 'popular' });
export const newGames = (page = 0): Promise<PagedLite> => discoverGames({ page, sort: 'new' });
export const topRatedGames = (page = 0): Promise<PagedLite> =>
  discoverGames({ page, sort: 'top_rated' });

/** IGDB full-text search (single page). */
export async function searchGames(query: string): Promise<GameLite[]> {
  const q = query.trim().replace(/"/g, '');
  if (!q) return [];
  const body = `search "${q}"; fields name, cover.url, rating, first_release_date, genres.name, platforms.name; where cover != null; limit ${PAGE_SIZE};`;
  const raw = await igdb<IgdbGame[]>('/games', body);
  return (Array.isArray(raw) ? raw : []).map(toGameLite);
}

// ---- Detail ----

export async function gameDetail(id: number): Promise<GameDetail> {
  const body =
    'fields name, summary, storyline, cover.url, rating, rating_count, first_release_date, ' +
    'genres.name, platforms.name, involved_companies.company.name, involved_companies.developer, ' +
    'involved_companies.publisher, screenshots.url, videos.video_id, similar_games.name, ' +
    'similar_games.cover.url, similar_games.rating, websites.url, websites.type; ' +
    `where id = ${id};`;
  const raw = (await igdb<IgdbGameDetail[]>('/games', body))?.[0];
  if (!raw) throw new Error('IGDB detail not found');

  const lite = toGameLite(raw);
  const companies = raw.involved_companies ?? [];
  const developers = companies
    .filter((c) => c.developer && c.company?.name)
    .map((c) => c.company!.name as string);
  const publishers = companies
    .filter((c) => c.publisher && c.company?.name)
    .map((c) => c.company!.name as string);

  return {
    ...lite,
    summary: raw.summary ?? raw.storyline ?? '',
    developers,
    publishers,
    genres: (raw.genres ?? []).map((g) => g.name),
    platforms: (raw.platforms ?? []).map((p) => p.name),
    screenshots: (raw.screenshots ?? [])
      .map((s) => igdbImage(s.url, 't_screenshot_big'))
      .filter((u): u is string => !!u),
    trailerYoutubeId: raw.videos?.find((v) => v.video_id)?.video_id ?? null,
    websites: (raw.websites ?? []).map((w) => ({ url: w.url, category: w.type })),
    similar: (raw.similar_games ?? []).map(toGameLite),
  };
}
