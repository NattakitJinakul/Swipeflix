/**
 * TMDB movie types. Field mapping per docs/04-tmdb-api.md.
 */

/** Minimal shape stored in library (watchlist grid, Firestore). */
export type MovieLite = {
  id: number;
  title: string;
  poster: string | null; // poster_path
  rating: number; // vote_average
  genreIds: number[]; // genre_ids
  year: string | null; // release_date -> YYYY
};

export type CastMember = {
  id: number;
  name: string;
  character: string;
  profile: string | null; // profile_path
};

export type CrewMember = {
  id: number;
  name: string;
  job: string;
  department: string;
  profile: string | null; // profile_path
};

export type Video = {
  key: string; // YouTube video id
  name: string;
  site: string; // 'YouTube'
  type: string; // 'Trailer' | 'Teaser' | ...
  official: boolean;
};

export type WatchProvider = {
  providerId: number; // provider_id
  providerName: string; // provider_name
  logo: string | null; // logo_path
};

export type Genre = {
  id: number;
  name: string;
};

export type ProductionCompany = {
  id: number;
  name: string;
  logo: string | null; // logo_path
};

/** Full detail — from /movie/{id}?append_to_response=credits,videos,recommendations,watch/providers */
export type MovieDetail = MovieLite & {
  runtime: number | null;
  overview: string;
  genres: Genre[];
  cast: CastMember[]; // credits.cast (first 10)
  crew: CrewMember[]; // credits.crew
  director: CrewMember | null; // crew where job === 'Director'
  productionCompanies: ProductionCompany[];
  videos: Video[]; // videos.results
  recommendations: MovieLite[]; // recommendations.results
  watchProviders: WatchProvider[]; // watch/providers flatrate for region
  backdrop: string | null; // backdrop_path
};

/** Kept broad for wrapping alias — the app's canonical movie is MovieDetail. */
export type Movie = MovieDetail;

// ---- Raw TMDB API response shapes (for mapping in endpoints.ts) ----

export type TMDBMovieResult = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids?: number[];
  release_date?: string;
  overview?: string;
};

export type TMDBPaged<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

export type TMDBMovieDetailRaw = {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  runtime: number | null;
  overview: string;
  genres: { id: number; name: string }[];
  production_companies: { id: number; name: string; logo_path: string | null }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
    crew: {
      id: number;
      name: string;
      job: string;
      department: string;
      profile_path: string | null;
    }[];
  };
  videos?: {
    results: {
      key: string;
      name: string;
      site: string;
      type: string;
      official: boolean;
    }[];
  };
  recommendations?: TMDBPaged<TMDBMovieResult>;
  'watch/providers'?: {
    results: Record<
      string,
      {
        link?: string;
        flatrate?: { provider_id: number; provider_name: string; logo_path: string | null }[];
      }
    >;
  };
};
