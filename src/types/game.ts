/**
 * FreeToGame types. Keyless API (https://www.freetogame.com/api).
 * Thumbnails/screenshots are FULL URLs already (no prefixing).
 * No rating, no metacritic, no trailers, no pagination.
 */

/** Minimal shape stored in library (grid, Firestore) + swipe deck cards. */
export type GameLite = {
  id: number;
  name: string;
  image: string | null; // thumbnail (full URL)
  genre: string; // e.g. "Shooter", "Action RPG"
  platform: string; // e.g. "PC (Windows)", "Web Browser"
  year: number | null; // release_date -> YYYY
};

/** Full detail — from /game?id= (adds description, sys req, screenshots) + related list. */
export type GameDetail = GameLite & {
  description: string; // long description
  shortDescription: string; // short_description
  developer: string;
  publisher: string;
  releaseDate: string | null; // YYYY-MM-DD
  gameUrl: string; // game_url (play/redirect link)
  sysReq: {
    os?: string;
    processor?: string;
    memory?: string;
    graphics?: string;
    storage?: string;
  } | null;
  screenshots: string[]; // screenshots[].image
  related: GameLite[]; // same-genre games (minus self)
};

// ---- Raw FreeToGame API response shapes (for mapping in endpoints.ts) ----

export type FtgGame = {
  id: number;
  title: string;
  thumbnail: string | null;
  short_description?: string;
  game_url?: string;
  genre: string;
  platform: string;
  publisher?: string;
  developer?: string;
  release_date?: string; // "YYYY-MM-DD" (may be "0000-00-00")
};

export type FtgGameDetail = FtgGame & {
  description?: string; // long
  status?: string;
  minimum_system_requirements?: {
    os?: string;
    processor?: string;
    memory?: string;
    graphics?: string;
    storage?: string;
  } | null;
  screenshots?: { id: number; image: string }[];
};
