/**
 * RAWG store name -> buy/storefront URL.
 * RAWG gives each store a real url (stores[].url); use it as the fallback and map the
 * well-known storefront homes with a ?ref= placeholder tag where useful.
 */

const REF = 'YOUR_TAG';

/** Keyed by RAWG store.name. Function receives the game name (some links can personalize). */
export const AFFILIATE: Record<string, (game: string) => string> = {
  Steam: (g) => `https://store.steampowered.com/search/?term=${encodeURIComponent(g)}&ref=${REF}`,
  'PlayStation Store': () => `https://store.playstation.com/?ref=${REF}`,
  'Xbox Store': () => `https://www.xbox.com/games/store?ref=${REF}`,
  'Xbox 360 Store': () => `https://www.xbox.com/games/store?ref=${REF}`,
  'Nintendo Store': () => `https://www.nintendo.com/store/?ref=${REF}`,
  'App Store': () => `https://www.apple.com/app-store/?ref=${REF}`,
  'Google Play': () => `https://play.google.com/store/games?ref=${REF}`,
  'GOG': (g) => `https://www.gog.com/games?query=${encodeURIComponent(g)}&ref=${REF}`,
  'itch.io': (g) => `https://itch.io/search?q=${encodeURIComponent(g)}&ref=${REF}`,
  'Epic Games': () => `https://store.epicgames.com/?ref=${REF}`,
};

/** Resolve a store URL for a store name, falling back to the RAWG-provided store link. */
export const affiliateUrl = (storeName: string, gameName: string, fallbackUrl: string): string =>
  AFFILIATE[storeName]?.(gameName) ?? fallbackUrl;
