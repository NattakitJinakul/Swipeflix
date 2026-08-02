import { useColorScheme as useRNColorScheme } from 'react-native';

import { useSettings } from '@/src/store/settings';

/**
 * App color scheme = user's theme preference (light/dark) or the system scheme when
 * the pref is 'system'. Must be used inside SettingsProvider (root wraps everything).
 */
export function useColorScheme(): 'light' | 'dark' {
  const system = useRNColorScheme();
  const { theme } = useSettings();
  if (theme === 'light' || theme === 'dark') return theme;
  return system ?? 'dark';
}
