/**
 * Game image resolver. RAWG images are FULL URLs already, so this is a passthrough
 * (kept local to components/ so UI stays decoupled from src/). Mirrors src/api/rawg `gameImage`.
 */
export const gameImage = (url?: string | null): string | null => url || null;
