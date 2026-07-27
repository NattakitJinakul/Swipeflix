/**
 * Movie DNA — pure helpers deriving taste insight from the user's liked/watched movies.
 * MovieLite has no cast/crew, so DNA is computed from genres, release year (decade) and rating.
 * See docs/11-enhancements.md (Profile — เสริม).
 */
import type { MovieLite } from '../types/movie';
import { tasteStats, type GenreStat } from './genres';

export type DecadeStat = {
  decade: number; // e.g. 1990
  label: string; // e.g. '90s'
  count: number;
  percent: number;
};

export type Badge = {
  id: string;
  label: string;
  icon: string; // Ionicons name
  earned: boolean;
  hint?: string; // how to earn (shown when locked)
};

export type MovieDNA = {
  topGenres: GenreStat[];
  favoriteDecade: DecadeStat | null;
  avgRating: number; // 0 when no data
  badges: Badge[];
};

const yearToDecade = (year: string | null): number | null => {
  if (!year) return null;
  const n = Number(year.slice(0, 4));
  if (!Number.isFinite(n) || n < 1900) return null;
  return Math.floor(n / 10) * 10;
};

const decadeLabel = (decade: number): string => {
  const short = decade % 100; // 1990 -> 90, 2000 -> 0
  return short === 0 ? `${decade}s` : `${short.toString().padStart(2, '0')}s`;
};

/** Most-liked decade from release years, with its share. Null when no dated movies. */
export function favoriteDecade(liked: MovieLite[]): DecadeStat | null {
  const counts = new Map<number, number>();
  let total = 0;
  for (const m of liked) {
    const d = yearToDecade(m.year);
    if (d == null) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return null;
  let best = -1;
  let bestCount = 0;
  for (const [d, c] of counts) {
    if (c > bestCount) {
      best = d;
      bestCount = c;
    }
  }
  return {
    decade: best,
    label: decadeLabel(best),
    count: bestCount,
    percent: Math.round((bestCount / total) * 100),
  };
}

/** Average vote_average across liked movies (rating > 0 only). 0 when none. */
export function avgRating(liked: MovieLite[]): number {
  const rated = liked.filter((m) => m.rating > 0);
  if (rated.length === 0) return 0;
  const sum = rated.reduce((acc, m) => acc + m.rating, 0);
  return Math.round((sum / rated.length) * 10) / 10;
}

// Genres considered "all covered" for the completionist badge.
const TOTAL_GENRES = 19;

/**
 * Gamified achievement badges. Earned flags derive from library size + taste shape.
 * Locked badges keep a `hint` so the UI can show progress goals.
 */
export function achievementBadges(
  liked: MovieLite[],
  watched: MovieLite[],
  stats: GenreStat[],
): Badge[] {
  const watchedCount = watched.length;
  const likedCount = liked.length;
  const distinctGenres = stats.length;
  const top = stats[0];
  const scifi = stats.find((s) => s.id === 878);
  const avg = avgRating(liked);

  return [
    {
      id: 'watched-10',
      label: 'ดู 10 เรื่อง',
      icon: 'film',
      earned: watchedCount >= 10,
      hint: `ดูแล้ว ${watchedCount}/10`,
    },
    {
      id: 'liked-25',
      label: 'นักปั่น 25 เรื่อง',
      icon: 'flame',
      earned: likedCount >= 25,
      hint: `ถูกใจ ${likedCount}/25`,
    },
    {
      id: 'scifi-fan',
      label: 'นัก Sci-Fi',
      icon: 'planet',
      earned: (scifi?.count ?? 0) >= 5,
      hint: `Sci-Fi ${scifi?.count ?? 0}/5`,
    },
    {
      id: 'genre-master',
      label: 'ดูครบทุกแนว',
      icon: 'grid',
      earned: distinctGenres >= TOTAL_GENRES,
      hint: `${distinctGenres}/${TOTAL_GENRES} แนว`,
    },
    {
      id: 'critic',
      label: 'คอหนังคุณภาพ',
      icon: 'star',
      earned: likedCount >= 5 && avg >= 8,
      hint: 'ชอบหนังเรตติ้ง 8+',
    },
    {
      id: 'loyalist',
      label: `แฟน ${top ? top.name : 'แนวโปรด'}`,
      icon: 'heart',
      earned: (top?.count ?? 0) >= 8,
      hint: top ? `${top.name} ${top.count}/8` : 'ถูกใจแนวเดิม 8 เรื่อง',
    },
  ];
}

/** Full DNA profile from the library. Pure — safe with empty arrays. */
export function computeDNA(liked: MovieLite[], watched: MovieLite[]): MovieDNA {
  const topGenres = tasteStats(liked);
  return {
    topGenres,
    favoriteDecade: favoriteDecade(liked),
    avgRating: avgRating(liked),
    badges: achievementBadges(liked, watched, topGenres),
  };
}
