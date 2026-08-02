/**
 * User + subscription types. Firestore users/{uid} per docs/03 + docs/09.
 */

export type Plan = 'free' | 'plus' | 'pro';

export type ThemePref = 'system' | 'light' | 'dark';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing';

export type UserProfile = {
  uid: string;
  displayName: string;
  email: string;
  avatar: string | null;
  region: string; // e.g. 'TH'
  language: string; // e.g. 'th-TH'
  theme: ThemePref;
  favoriteGenres: string[]; // FreeToGame category slugs
};

export type Subscription = {
  plan: Plan;
  renewsAt: string | null; // ISO date; null for free
  status: SubscriptionStatus;
};
