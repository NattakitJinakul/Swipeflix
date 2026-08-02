/**
 * Game image resolver. IGDB image URLs are pre-resolved to absolute https URLs by the API layer
 * (src/api/igdb `igdbImage`), so this is a passthrough kept local to components/ (UI decoupled
 * from src/).
 */
export const gameImage = (url?: string | null): string | null => url || null;
