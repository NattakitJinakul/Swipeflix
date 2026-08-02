/**
 * useFirstRun(key) — one-time flags backed by AsyncStorage, e.g. the swipe tutorial.
 * Returns { seen: boolean | null (null while loading), markSeen(), reset() }.
 * A tiny module-level store keeps every hook instance for a key in sync, so calling reset()
 * from Settings immediately re-shows the tutorial on the (still-mounted) Swipe tab.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

// undefined = not yet loaded from storage.
const memory: Record<string, boolean | undefined> = {};
const subs: Record<string, Set<() => void>> = {};

const notify = (key: string) => subs[key]?.forEach((fn) => fn());

export type FirstRun = { seen: boolean | null; markSeen: () => void; reset: () => void };

export function useFirstRun(key: string): FirstRun {
  const [seen, setSeen] = useState<boolean | null>(memory[key] ?? null);

  useEffect(() => {
    let active = true;
    (subs[key] ??= new Set());
    const fn = () => {
      if (active) setSeen(memory[key] ?? null);
    };
    subs[key].add(fn);

    if (memory[key] === undefined) {
      AsyncStorage.getItem(key)
        .then((v) => {
          memory[key] = v === '1';
          notify(key);
        })
        .catch(() => {
          // On storage failure default to "seen" so we never nag.
          memory[key] = true;
          notify(key);
        });
    } else {
      setSeen(memory[key]!);
    }

    return () => {
      active = false;
      subs[key]?.delete(fn);
    };
  }, [key]);

  const markSeen = useCallback(() => {
    memory[key] = true;
    void AsyncStorage.setItem(key, '1').catch(() => {});
    notify(key);
  }, [key]);

  const reset = useCallback(() => {
    memory[key] = false;
    void AsyncStorage.removeItem(key).catch(() => {});
    notify(key);
  }, [key]);

  return { seen, markSeen, reset };
}
