/**
 * Streaming provider -> affiliate/signup link. docs/05.
 * TMDB gives no affiliate links; we map provider name -> URL with a ?ref= placeholder tag.
 * Falls back to the TMDB watch link when a provider is not mapped.
 */

const REF = 'YOUR_TAG';

/** Keyed by TMDB provider_name. Function receives the movie title (some links can personalize). */
export const AFFILIATE: Record<string, (title: string) => string> = {
  Netflix: () => `https://www.netflix.com/signup?ref=${REF}`,
  'Amazon Prime Video': () => `https://www.primevideo.com/?tag=${REF}`,
  'Disney Plus': () => `https://www.disneyplus.com/?cid=${REF}`,
  'Apple TV Plus': () => `https://tv.apple.com/?ref=${REF}`,
  'HBO Max': () => `https://www.max.com/?ref=${REF}`,
  Max: () => `https://www.max.com/?ref=${REF}`,
  Viu: () => `https://www.viu.com/?ref=${REF}`,
  TrueID: () => `https://trueid.net/?ref=${REF}`,
  'YouTube Premium': () => `https://www.youtube.com/premium?ref=${REF}`,
};

/** Resolve an affiliate URL for a provider, falling back to the given TMDB link. */
export const affiliateUrl = (provider: string, title: string, fallback: string): string =>
  AFFILIATE[provider]?.(title) ?? fallback;
