import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/src/store/auth';
import { LibraryProvider } from '@/src/store/library';
import { SettingsProvider, useSettings } from '@/src/store/settings';

export const unstable_settings = {
  anchor: '(tabs)',
};

// (auth) screens a not-yet-onboarded user is allowed to sit on (the signup funnel).
const FUNNEL = ['signup', 'pricing', 'onboarding'];

/**
 * Auth gate. Kept group-aware so the signup->pricing->onboarding funnel isn't interrupted.
 * `onboarded` reads profile.onboarded (cold start) OR live favoriteGenres from settings
 * (so completing onboarding flips the gate without a stale-profile bounce).
 */
function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, profile, loading } = useAuth();
  const { favoriteGenres } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  const onboarded =
    !!(profile as { onboarded?: boolean } | null)?.onboarded || favoriteGenres.length >= 3;

  useEffect(() => {
    if (loading) return;
    const segs = segments as string[];
    const inAuth = segs[0] === '(auth)';
    if (!user) {
      if (!inAuth) router.replace('/(auth)/login');
      return;
    }
    if (!onboarded) {
      const inFunnel = inAuth && FUNNEL.includes(String(segs[1]));
      if (!inFunnel) router.replace('/(auth)/onboarding');
      return;
    }
    if (inAuth) router.replace('/(tabs)');
  }, [user, onboarded, loading, segments, router]);

  const c = Colors[colorScheme ?? 'dark'];

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.background,
        }}
      >
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="movie/[id]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}

// Reads the (settings-aware) color scheme — must live INSIDE SettingsProvider.
function ThemedRoot() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootNavigator />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SettingsProvider>
          <LibraryProvider>
            <ThemedRoot />
          </LibraryProvider>
        </SettingsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
