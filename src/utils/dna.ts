/**
 * Game DNA — pure helpers deriving taste insight from the user's liked/played games.
 * FreeToGame has no rating/metacritic, so DNA is genre-string + release-decade based.
 */
import type { GameLite } from '../types/game';
import { tasteStats, type GenreStat } from './genres';

export type DecadeStat = {
  decade: number; // e.g. 2010
  label: string; // e.g. '10s'
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

export type GameDNA = {
  topGenres: GenreStat[];
  favoriteDecade: DecadeStat | null;
  badges: Badge[];
};

const yearToDecade = (year: number | null): number | null => {
  if (year == null || !Number.isFinite(year) || year < 1970) return null;
  return Math.floor(year / 10) * 10;
};

const decadeLabel = (decade: number): string => {
  const short = decade % 100; // 2010 -> 10, 2000 -> 0
  return short === 0 ? `${decade}s` : `${short.toString().padStart(2, '0')}s`;
};

/** Most-liked decade from release years, with its share. Null when no dated games. */
export function favoriteDecade(games: GameLite[]): DecadeStat | null {
  const counts = new Map<number, number>();
  let total = 0;
  for (const g of games) {
    const d = yearToDecade(g.year);
    if (d == null) continue;
    counts.set(d, (counts.get(d) ?? 0) + 1);
    total += 1;
  }
  if (total === 0) return null;
  let best = -1;
  let bestCount = 0;
  for (const [d, cnt] of counts) {
    if (cnt > bestCount) {
      best = d;
      bestCount = cnt;
    }
  }
  return {
    decade: best,
    label: decadeLabel(best),
    count: bestCount,
    percent: Math.round((bestCount / total) * 100),
  };
}

// Distinct genres considered "all covered" for the completionist badge.
const GENRE_GOAL = 10;

/** Gamified achievement badges. Earned flags derive from library size + taste shape. */
export function achievementBadges(
  liked: GameLite[],
  played: GameLite[],
  stats: GenreStat[],
): Badge[] {
  const playedCount = played.length;
  const likedCount = liked.length;
  const distinctGenres = stats.length;
  const top = stats[0];
  const shooter = stats.find((s) => s.name.toLowerCase().includes('shooter'));

  return [
    {
      id: 'played-10',
      label: 'เล่นครบ 10 เกม',
      icon: 'game-controller',
      earned: playedCount >= 10,
      hint: `เล่นแล้ว ${playedCount}/10`,
    },
    {
      id: 'liked-25',
      label: 'นักปั่น 25 เกม',
      icon: 'flame',
      earned: likedCount >= 25,
      hint: `ถูกใจ ${likedCount}/25`,
    },
    {
      id: 'shooter-fan',
      label: 'สายยิง',
      icon: 'skull',
      earned: (shooter?.count ?? 0) >= 5,
      hint: `Shooter ${shooter?.count ?? 0}/5`,
    },
    {
      id: 'genre-master',
      label: 'ครบทุกแนว',
      icon: 'grid',
      earned: distinctGenres >= GENRE_GOAL,
      hint: `${distinctGenres}/${GENRE_GOAL} แนว`,
    },
    {
      id: 'explorer',
      label: 'นักสำรวจ',
      icon: 'compass',
      earned: likedCount + playedCount >= 40,
      hint: `รวม ${likedCount + playedCount}/40 เกม`,
    },
    {
      id: 'loyalist',
      label: `แฟน ${top ? top.name : 'แนวโปรด'}`,
      icon: 'heart',
      earned: (top?.count ?? 0) >= 8,
      hint: top ? `${top.name} ${top.count}/8` : 'ถูกใจแนวเดิม 8 เกม',
    },
  ];
}

/** Full DNA profile from the library. Pure — safe with empty arrays. */
export function computeDNA(liked: GameLite[], played: GameLite[]): GameDNA {
  const topGenres = tasteStats(liked);
  return {
    topGenres,
    favoriteDecade: favoriteDecade(liked),
    badges: achievementBadges(liked, played, topGenres),
  };
}
