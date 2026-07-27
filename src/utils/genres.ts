/**
 * TMDB genre id -> name map + taste stats helper.
 * IDs from TMDB /genre/movie/list (stable). Prefer live genreList() when available.
 */
import type { MovieLite } from '../types/movie';

export const GENRE_MAP: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
};

export const genreName = (id: number): string => GENRE_MAP[id] ?? `#${id}`;

export const genreNames = (ids: number[]): string[] => ids.map(genreName);

export type GenreStat = { id: number; name: string; count: number; percent: number };

/**
 * Genre distribution across liked movies, sorted by count desc.
 * percent = share of total genre tags (a movie contributes to each of its genres).
 */
export function tasteStats(likedMovies: MovieLite[]): GenreStat[] {
  const counts = new Map<number, number>();
  let total = 0;
  for (const m of likedMovies) {
    for (const id of m.genreIds) {
      counts.set(id, (counts.get(id) ?? 0) + 1);
      total += 1;
    }
  }
  const stats: GenreStat[] = [...counts.entries()].map(([id, count]) => ({
    id,
    name: genreName(id),
    count,
    percent: total > 0 ? Math.round((count / total) * 100) : 0,
  }));
  return stats.sort((a, b) => b.count - a.count);
}
