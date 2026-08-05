/**
 * User + public-profile types. Firestore users/{uid} per docs/03.
 */

export type ThemePref = 'system' | 'light' | 'dark';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  avatar: string | null;
  language: string; // e.g. 'th-TH'
  theme: ThemePref;
  favoriteGenres: string[]; // IGDB genre names
  showLikedGames: boolean; // privacy: expose liked games on the public (Community) profile
};

/** A compact game reference stored on the public profile (cover grid). */
export type PublicGame = { id: number; name: string; image: string | null };

/** Compact public summary written to users/{uid}.public for the Community feature. */
export type PublicProfile = {
  uid: string;
  displayName: string;
  avatar: string | null;
  favoriteGenres: string[];
  likedCount: number;
  topGenres: { name: string; percent: number }[];
  likedGames: PublicGame[]; // empty when the user hides them (showLikedGames = false)
};
