/**
 * FreeToGame categories (string genres) + taste stats helper.
 * Genre is already a display string on each game — no id maps needed.
 */
import type { GameLite } from '../types/game';

/** FreeToGame category slugs (for /games?category= + filter/onboarding chips). */
export const CATEGORIES: string[] = [
  'shooter',
  'mmorpg',
  'strategy',
  'moba',
  'racing',
  'sports',
  'social',
  'sandbox',
  'open-world',
  'survival',
  'pvp',
  'pve',
  'pixel',
  'turn-based',
  'first-person',
  'third-person',
  'top-down',
  'tower-defense',
  'mmofps',
  'fighting',
  'action-rpg',
  'action',
  'military',
  'martial-arts',
  'battle-royale',
  'mmo',
  'mmorts',
  'fantasy',
  'sci-fi',
  'card',
  'horror',
  'zombie',
  'flight',
  'low-spec',
  'anime',
  '2d',
  '3d',
];

/** Display label for a category slug, e.g. "action-rpg" -> "Action Rpg". */
export const categoryLabel = (slug: string): string =>
  slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** Normalize a FreeToGame genre string to a category slug, e.g. "Action RPG" -> "action-rpg". */
export const slugifyGenre = (genre: string): string =>
  genre.trim().toLowerCase().replace(/\s+/g, '-');

/** Genre is already a string on the game — this is a passthrough for API symmetry. */
export const genreNames = (genres: string[]): string[] => genres;

export type GenreStat = { name: string; count: number; percent: number };

/**
 * Genre distribution across the given games (by genre string), sorted by count desc.
 * percent = share of all games counted.
 */
export function tasteStats(games: GameLite[]): GenreStat[] {
  const counts = new Map<string, number>();
  let total = 0;
  for (const g of games) {
    if (!g.genre) continue;
    counts.set(g.genre, (counts.get(g.genre) ?? 0) + 1);
    total += 1;
  }
  const stats: GenreStat[] = [...counts.entries()].map(([name, count]) => ({
    name,
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
  return stats.sort((a, b) => b.count - a.count);
}
