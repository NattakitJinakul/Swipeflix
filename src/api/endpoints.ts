/**
 * Typed IGDB endpoint functions + raw->app mapping (apicalypse bodies).
 * Server-side pagination via `limit 20; offset page*20;` (page is 0-based).
 */
import { igdb, igdbImage } from './igdb';
import type {
  CompanyInfo,
  GameDetail,
  GameLite,
  IgdbGame,
  IgdbGameDetail,
  Ref,
  ReviewGame,
  UpcomingGame,
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

// ---- Discover (bento feed) ----

/** Deterministic "Game of the Day" — stable per calendar day, picked from the popular list. */
export async function gameOfDay(): Promise<GameLite | null> {
  const { results } = await popularGames(0);
  if (!results.length) return null;
  return results[new Date().getDate() % results.length];
}

/** Most anticipated unreleased games (by hype) -> countdown targets. */
export async function upcomingGames(): Promise<UpcomingGame[]> {
  const now = Math.floor(Date.now() / 1000);
  const body =
    'fields name, cover.url, first_release_date, hypes, genres.name; ' +
    `where first_release_date > ${now} & cover != null & hypes != null; sort hypes desc; limit 6;`;
  const raw = await igdb<(IgdbGame & { hypes?: number })[]>('/games', body);
  return (Array.isArray(raw) ? raw : [])
    .filter((r) => r.first_release_date != null)
    .map((r) => ({
      id: r.id,
      name: r.name,
      image: igdbImage(r.cover?.url ?? null, 't_cover_big'),
      releaseEpoch: r.first_release_date as number,
      genre: r.genres?.[0]?.name ?? '',
    }));
}

/** Recently released, rated games for the reviews wall (landscape screenshot preferred). */
export async function recentReviews(): Promise<ReviewGame[]> {
  const now = Math.floor(Date.now() / 1000);
  const six = now - 60 * 60 * 24 * 182;
  const body =
    'fields name, cover.url, rating, rating_count, genres.name, first_release_date, screenshots.url; ' +
    `where rating != null & rating_count > 20 & first_release_date != null & first_release_date < ${now} ` +
    `& first_release_date > ${six} & cover != null; sort first_release_date desc; limit 7;`;
  const raw = await igdb<(IgdbGame & { screenshots?: { url: string }[] })[]>('/games', body);
  return (Array.isArray(raw) ? raw : []).map((r) => {
    const shot = r.screenshots?.[0]?.url;
    return {
      id: r.id,
      name: r.name,
      image: igdbImage(shot ?? r.cover?.url ?? null, shot ? 't_screenshot_big' : 't_720p'),
      rating: r.rating ?? 0,
      genre: r.genres?.[0]?.name ?? '',
    };
  });
}

// ---- Mini-games (สนุก tab) ----

/** A well-known game with playable screenshots — used by the "เกมอะไรเอ่ย?" guess game. */
export type GuessGame = { id: number; name: string; screenshots: string[] };

/** ~40 famous games that have screenshots, for the guessing game. */
export async function guessGames(): Promise<GuessGame[]> {
  const body =
    'fields name, screenshots.url; ' +
    'where screenshots != null & rating_count > 80 & cover != null; ' +
    'sort rating_count desc; limit 40;';
  const raw = await igdb<(IgdbGame & { screenshots?: IgdbImageRefLite[] })[]>('/games', body);
  return (Array.isArray(raw) ? raw : [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      screenshots: (r.screenshots ?? [])
        .map((s) => igdbImage(s.url, 't_screenshot_big'))
        .filter((u): u is string => !!u),
    }))
    .filter((g) => g.screenshots.length > 0);
}

type IgdbImageRefLite = { id?: number; url: string };

/** Screenshots for a specific set of game ids (for "guess from my Likes"). Empty on no ids/failure. */
export async function screenshotsForGames(ids: number[]): Promise<GuessGame[]> {
  const list = ids.slice(0, 50);
  if (!list.length) return [];
  const body =
    'fields name, screenshots.url; ' +
    `where id = (${list.join(',')}) & screenshots != null; limit ${list.length};`;
  const raw = await igdb<(IgdbGame & { screenshots?: IgdbImageRefLite[] })[]>('/games', body);
  return (Array.isArray(raw) ? raw : [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      screenshots: (r.screenshots ?? [])
        .map((s) => igdbImage(s.url, 't_screenshot_big'))
        .filter((u): u is string => !!u),
    }))
    .filter((g) => g.screenshots.length > 0);
}

/** ~40 popular games (cover + rating) for the "VS ตัวต่อตัว" head-to-head. */
export async function versusGames(): Promise<GameLite[]> {
  const body =
    'fields name, cover.url, rating, rating_count, genres.name, platforms.name, first_release_date; ' +
    'where cover != null & rating_count > 60; ' +
    'sort rating_count desc; limit 40;';
  const raw = await igdb<IgdbGame[]>('/games', body);
  return (Array.isArray(raw) ? raw : []).map(toGameLite).filter((g) => !!g.image);
}

// ---- Detail ----

export async function gameDetail(id: number): Promise<GameDetail> {
  const body =
    'fields name, summary, storyline, cover.url, rating, rating_count, first_release_date, ' +
    'genres.name, platforms.name, involved_companies.company.id, involved_companies.company.name, ' +
    'involved_companies.developer, involved_companies.publisher, screenshots.url, videos.video_id, ' +
    'similar_games.name, similar_games.cover.url, similar_games.rating, websites.url, websites.type; ' +
    `where id = ${id};`;
  const raw = (await igdb<IgdbGameDetail[]>('/games', body))?.[0];
  if (!raw) throw new Error('IGDB detail not found');

  const lite = toGameLite(raw);
  const companies = raw.involved_companies ?? [];
  const developerRefs: Ref[] = companies
    .filter((c) => c.developer && c.company?.id && c.company?.name)
    .map((c) => ({ id: c.company!.id as number, name: c.company!.name as string }));
  const publisherRefs: Ref[] = companies
    .filter((c) => c.publisher && c.company?.id && c.company?.name)
    .map((c) => ({ id: c.company!.id as number, name: c.company!.name as string }));
  const genreRefs: Ref[] = (raw.genres ?? []).map((g) => ({ id: g.id, name: g.name }));
  const platformRefs: Ref[] = (raw.platforms ?? []).map((p) => ({ id: p.id, name: p.name }));

  return {
    ...lite,
    summary: raw.summary ?? raw.storyline ?? '',
    developers: developerRefs.map((r) => r.name),
    publishers: publisherRefs.map((r) => r.name),
    genres: genreRefs.map((r) => r.name),
    platforms: platformRefs.map((r) => r.name),
    developerRefs,
    publisherRefs,
    genreRefs,
    platformRefs,
    screenshots: (raw.screenshots ?? [])
      .map((s) => igdbImage(s.url, 't_screenshot_big'))
      .filter((u): u is string => !!u),
    trailerYoutubeId: raw.videos?.find((v) => v.video_id)?.video_id ?? null,
    websites: (raw.websites ?? []).map((w) => ({ url: w.url, category: w.type })),
    similar: (raw.similar_games ?? []).map(toGameLite),
  };
}

// ---- Browse by genre / platform / company ----

const browseList = async (where: string, page: number): Promise<PagedLite> => {
  const body = [
    LIST_FIELDS,
    `where ${where} & cover != null;`,
    'sort rating_count desc;',
    `limit ${PAGE_SIZE};`,
    `offset ${page * PAGE_SIZE};`,
  ].join(' ');
  const raw = await igdb<IgdbGame[]>('/games', body);
  const results = (Array.isArray(raw) ? raw : []).map(toGameLite);
  return { page, hasMore: results.length >= PAGE_SIZE, results };
};

export const gamesByGenre = (genreId: number, page = 0): Promise<PagedLite> =>
  browseList(`genres = (${genreId})`, page);

export const gamesByPlatform = (platformId: number, page = 0): Promise<PagedLite> =>
  browseList(`platforms = (${platformId})`, page);

export const gamesByCompany = (companyId: number, page = 0): Promise<PagedLite> =>
  browseList(`involved_companies.company = (${companyId})`, page);

/** Company info for a browse-by-company header. Null on failure. */
export async function companyInfo(companyId: number): Promise<CompanyInfo | null> {
  try {
    const body = `fields name, description, logo.url, country; where id = ${companyId};`;
    const raw = (await igdb<{ id: number; name: string; description?: string; logo?: { url: string } | null }[]>(
      '/companies',
      body,
    ))?.[0];
    if (!raw) return null;
    return {
      id: raw.id,
      name: raw.name,
      description: raw.description ?? '',
      logo: igdbImage(raw.logo?.url ?? null, 't_logo_med'),
    };
  } catch {
    return null;
  }
}
