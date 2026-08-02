/**
 * IGDB genres (curated name<->id map) + taste stats helper.
 * Names are used for chips/display + tasteStats; ids feed the deck `where genres = (...)` filter.
 */
import type { GameLite } from '../types/game';

/** Curated IGDB genres (id + display name). */
export const GENRES: { id: number; name: string }[] = [
  { id: 4, name: 'Fighting' },
  { id: 5, name: 'Shooter' },
  { id: 8, name: 'Platform' },
  { id: 9, name: 'Puzzle' },
  { id: 10, name: 'Racing' },
  { id: 11, name: 'RTS' },
  { id: 12, name: 'RPG' },
  { id: 13, name: 'Simulator' },
  { id: 14, name: 'Sport' },
  { id: 15, name: 'Strategy' },
  { id: 16, name: 'Turn-based' },
  { id: 24, name: 'Tactical' },
  { id: 25, name: 'Hack and slash' },
  { id: 26, name: 'Quiz' },
  { id: 31, name: 'Adventure' },
  { id: 32, name: 'Indie' },
  { id: 33, name: 'Arcade' },
  { id: 34, name: 'Visual Novel' },
  { id: 35, name: 'Card & Board' },
  { id: 36, name: 'MOBA' },
  { id: 2, name: 'Point-and-click' },
];

/** Genre display names (chips / onboarding / filter). */
export const CATEGORIES: string[] = GENRES.map((g) => g.name);

const NAME_TO_ID = new Map(GENRES.map((g) => [g.name, g.id]));

/** IGDB genre id for a curated genre name (undefined if unknown). */
export const genreId = (name: string): number | undefined => NAME_TO_ID.get(name);

/** Map curated genre names -> IGDB ids (drops unknowns). */
export const genreIds = (names: string[]): number[] =>
  names.map((n) => NAME_TO_ID.get(n)).filter((v): v is number => v != null);

/** IGDB genre names are already display strings — identity helper for symmetry. */
export const categoryLabel = (name: string): string => name;
export const genreNames = (names: string[]): string[] => names;

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
