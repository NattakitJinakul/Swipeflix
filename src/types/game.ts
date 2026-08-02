/**
 * IGDB types. POST + apicalypse; auth via Client-ID + Bearer headers.
 * Images arrive as `//images.igdb.com/.../t_thumb/<hash>.jpg` — endpoints pre-resolve them to
 * full https URLs (igdbImage), so GameLite.image / screenshots[] are already absolute.
 */

/** Minimal shape stored in library (grid, Firestore) + swipe deck cards. */
export type GameLite = {
  id: number;
  name: string;
  image: string | null; // cover (full URL, t_cover_big)
  genre: string; // first genre name
  platform: string; // first platform name
  year: number | null; // first_release_date -> YYYY
  rating: number | null; // IGDB rating 0..100
};

/** Full detail — from /games detail query + mapped relations. */
export type GameDetail = GameLite & {
  summary: string;
  developers: string[]; // involved_companies where developer
  publishers: string[]; // involved_companies where publisher
  genres: string[]; // genres[].name
  platforms: string[]; // platforms[].name
  screenshots: string[]; // screenshots[].url -> full URLs
  trailerYoutubeId: string | null; // videos[0].video_id
  websites: { url: string; category: number }[];
  similar: GameLite[]; // similar_games
};

// ---- Raw IGDB API response shapes (for mapping in endpoints.ts) ----

export type IgdbImageRef = { id?: number; url: string };

export type IgdbGame = {
  id: number;
  name: string;
  cover?: IgdbImageRef | null;
  rating?: number | null;
  rating_count?: number | null;
  first_release_date?: number | null; // unix epoch seconds
  genres?: { id: number; name: string }[];
  platforms?: { id: number; name: string }[];
};

export type IgdbGameDetail = IgdbGame & {
  summary?: string;
  storyline?: string;
  involved_companies?: {
    company?: { name?: string };
    developer?: boolean;
    publisher?: boolean;
  }[];
  screenshots?: IgdbImageRef[];
  videos?: { video_id?: string }[];
  similar_games?: IgdbGame[];
  websites?: { url: string; type: number }[];
};
