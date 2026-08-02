/**
 * Minimal i18n. Default language = English; users switch to Thai in Settings.
 * `useT()` returns a `t(key, vars?)` function resolving dot-path keys from the active
 * dictionary, falling back to English then the raw key. Screens add their strings to en.ts + th.ts.
 */
import { useMemo } from 'react';

import { useSettings } from '@/src/store/settings';
import { en } from './en';
import { th } from './th';

export type Dict = Record<string, unknown>;
const DICTS: Record<string, Dict> = { en, th };

function get(obj: Dict, path: string): string | undefined {
  const v = path.split('.').reduce<unknown>((o, k) => (o == null ? undefined : (o as Dict)[k]), obj);
  return typeof v === 'string' ? v : undefined;
}

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

/** Resolve the active language code ('en' | 'th') from the settings string. */
export function langOf(language: string | undefined): 'en' | 'th' {
  return language?.toLowerCase().startsWith('th') ? 'th' : 'en';
}

export function useT(): TFunc {
  const { language } = useSettings();
  const lang = langOf(language);
  return useMemo<TFunc>(() => {
    return (key, vars) => {
      let s = get(DICTS[lang], key) ?? get(en, key) ?? key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
      return s;
    };
  }, [lang]);
}
