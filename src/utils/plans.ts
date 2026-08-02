/**
 * Subscription tier definitions + feature gates. docs/09 table.
 */
import type { Plan } from '../types/user';

export type PlanDef = {
  id: Plan;
  name: string;
  price: number; // THB / month
  perks: string[];
  swipeLimit: number | null; // null = unlimited
  watchlistLimit: number | null; // null = unlimited
  recommended?: boolean;
};

export const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    perks: ['ปัดได้ 20 เรื่อง/วัน', 'watchlist สูงสุด 30', 'มีโฆษณา'],
    swipeLimit: 20,
    watchlistLimit: 30,
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 59,
    perks: ['ปัดไม่จำกัด', 'watchlist ไม่จำกัด', 'ไม่มีโฆษณา'],
    swipeLimit: null,
    watchlistLimit: null,
    recommended: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 129,
    perks: [
      'ทุกอย่างใน Plus',
      'เลือก region หลายประเทศ',
      'taste insight ละเอียด',
      'early access',
    ],
    swipeLimit: null,
    watchlistLimit: null,
  },
];

export const getPlan = (id: Plan): PlanDef =>
  PLANS.find((p) => p.id === id) ?? PLANS[0];

/** True when the user may swipe again today given how many swipes already used. */
export function canSwipe(plan: Plan, todayCount: number): boolean {
  const { swipeLimit } = getPlan(plan);
  return swipeLimit == null || todayCount < swipeLimit;
}

/** True when the user may add another game to their watchlist given current count. */
export function canAddToWatchlist(plan: Plan, count: number): boolean {
  const { watchlistLimit } = getPlan(plan);
  return watchlistLimit == null || count < watchlistLimit;
}
