/**
 * Typed TMDB endpoint functions + raw->app mapping. See docs/04-tmdb-api.md.
 */
import { tmdb, type TmdbParams } from './tmdb';
import type {
  CastMember,
  CrewMember,
  Genre,
  MovieDetail,
  MovieLite,
  ProductionCompany,
  TMDBMovieDetailRaw,
  TMDBMovieResult,
  TMDBPaged,
  Video,
  WatchProvider,
} from '../types/movie';

const yearOf = (releaseDate?: string): string | null =>
  releaseDate ? releaseDate.slice(0, 4) : null;

export function toMovieLite(r: TMDBMovieResult): MovieLite {
  return {
    id: r.id,
    title: r.title,
    poster: r.poster_path,
    rating: r.vote_average,
    genreIds: r.genre_ids ?? [],
    year: yearOf(r.release_date),
  };
}

export type PagedLite = { page: number; totalPages: number; results: MovieLite[] };

function toPagedLite(raw: TMDBPaged<TMDBMovieResult>): PagedLite {
  return {
    page: raw.page,
    totalPages: raw.total_pages,
    results: raw.results.map(toMovieLite),
  };
}

// ---- Discover / lists ----

export type DiscoverOptions = {
  page?: number;
  genres?: number[];
  year?: number;
  minRating?: number;
  sortBy?: string;
  language?: string;
  region?: string;
};

export async function discoverMovies(opts: DiscoverOptions = {}): Promise<PagedLite> {
  const params: TmdbParams = {
    page: opts.page ?? 1,
    sort_by: opts.sortBy ?? 'popularity.desc',
  };
  if (opts.genres?.length) params.with_genres = opts.genres.join(',');
  if (opts.year) params.primary_release_year = opts.year;
  if (opts.minRating != null) params['vote_average.gte'] = opts.minRating;
  if (opts.language) params.language = opts.language;
  if (opts.region) params.region = opts.region;
  const raw = await tmdb<TMDBPaged<TMDBMovieResult>>('/discover/movie', params);
  return toPagedLite(raw);
}

export async function popularMovies(page = 1): Promise<PagedLite> {
  const raw = await tmdb<TMDBPaged<TMDBMovieResult>>('/movie/popular', { page });
  return toPagedLite(raw);
}

export async function trending(
  window: 'day' | 'week' = 'week'
): Promise<PagedLite> {
  const raw = await tmdb<TMDBPaged<TMDBMovieResult>>(`/trending/movie/${window}`);
  return toPagedLite(raw);
}

export async function searchMovies(query: string, page = 1): Promise<PagedLite> {
  const raw = await tmdb<TMDBPaged<TMDBMovieResult>>('/search/movie', {
    query,
    page,
    include_adult: 'false',
  });
  return toPagedLite(raw);
}

// ---- Genres ----

export async function genreList(language?: string): Promise<Genre[]> {
  const params: TmdbParams = {};
  if (language) params.language = language;
  const raw = await tmdb<{ genres: Genre[] }>('/genre/movie/list', params);
  return raw.genres;
}

// ---- Detail ----

function mapDetail(raw: TMDBMovieDetailRaw, region = 'TH'): MovieDetail {
  const cast: CastMember[] = (raw.credits?.cast ?? []).slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    character: c.character,
    profile: c.profile_path,
  }));
  const crew: CrewMember[] = (raw.credits?.crew ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    job: c.job,
    department: c.department,
    profile: c.profile_path,
  }));
  const director = crew.find((c) => c.job === 'Director') ?? null;
  const videos: Video[] = (raw.videos?.results ?? []).map((v) => ({
    key: v.key,
    name: v.name,
    site: v.site,
    type: v.type,
    official: v.official,
  }));
  const productionCompanies: ProductionCompany[] = (raw.production_companies ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    logo: p.logo_path,
  }));
  const recommendations: MovieLite[] = (raw.recommendations?.results ?? []).map(toMovieLite);
  const galleryBackdrops = (raw.images?.backdrops ?? []).map((b) => b.file_path).filter(Boolean);
  const backdrops = galleryBackdrops.length
    ? galleryBackdrops.slice(0, 10)
    : raw.backdrop_path
      ? [raw.backdrop_path]
      : [];
  const regionProviders = raw['watch/providers']?.results?.[region];
  const watchProviders: WatchProvider[] = (regionProviders?.flatrate ?? []).map((p) => ({
    providerId: p.provider_id,
    providerName: p.provider_name,
    logo: p.logo_path,
  }));

  return {
    id: raw.id,
    title: raw.title,
    poster: raw.poster_path,
    backdrop: raw.backdrop_path,
    rating: raw.vote_average,
    genreIds: raw.genres.map((g) => g.id),
    year: yearOf(raw.release_date),
    runtime: raw.runtime,
    overview: raw.overview,
    genres: raw.genres,
    cast,
    crew,
    director,
    productionCompanies,
    videos,
    recommendations,
    watchProviders,
    backdrops,
  };
}

export async function movieDetail(id: number, language?: string, region = 'TH'): Promise<MovieDetail> {
  const params: TmdbParams = {
    append_to_response: 'credits,videos,recommendations,watch/providers,images',
    // Include EN + TH videos so Thai-locale requests still surface English-only trailers.
    include_video_language: 'en,th',
    // Language-neutral + EN/TH backdrops for the hero gallery.
    include_image_language: 'en,th,null',
  };
  if (language) params.language = language;
  const raw = await tmdb<TMDBMovieDetailRaw>(`/movie/${id}`, params);
  return mapDetail(raw, region);
}

/** Fetch only the en-US overview (single request) — the fallback when a localized overview is blank. */
export async function englishOverview(id: number): Promise<string> {
  const en = await tmdb<TMDBMovieDetailRaw>(`/movie/${id}`, { language: 'en-US' });
  return en.overview ?? '';
}

/** Overview with th->en fallback. Returns fallback=true when the requested-language text was empty. */
export async function getOverview(
  id: number,
  lang: string
): Promise<{ text: string; fallback: boolean }> {
  const primary = await tmdb<TMDBMovieDetailRaw>(`/movie/${id}`, { language: lang });
  if (primary.overview?.trim()) return { text: primary.overview, fallback: false };
  const en = await tmdb<TMDBMovieDetailRaw>(`/movie/${id}`, { language: 'en-US' });
  return { text: en.overview ?? '', fallback: true };
}
