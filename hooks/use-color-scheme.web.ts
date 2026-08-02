import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useSettings } from '@/src/store/settings';

/**
 * Web color scheme. Honors the user's theme preference (light/dark); falls back to the
 * system scheme when the pref is 'system'. Re-calculated on the client for static rendering.
 */
export function useColorScheme(): 'light' | 'dark' {
  const [hasHydrated, setHasHydrated] = useState(false);
  useEffect(() => setHasHydrated(true), []);

  const system = useRNColorScheme();
  const { theme } = useSettings();

  if (theme === 'light' || theme === 'dark') return theme;
  if (hasHydrated) return system ?? 'light';
  return 'light';
}
