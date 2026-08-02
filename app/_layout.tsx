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
import { SettingsProvider } from '@/src/store/settings';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * Guest-first gate: an unauthenticated user lands on (tabs) and can browse/swipe freely —
 * NO login wall, NO forced onboarding. The (auth) group stays reachable (login/signup) but
 * isn't a wall; onboarding is reachable from Profile. When a user IS signed in and still
 * sitting in the (auth) funnel, bounce them into the tabs.
 */
function RootNavigator() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const segs = segments as string[];
    const inAuth = segs[0] === '(auth)';
    // Guests: no redirect. Signed-in users sitting on the login/signup LANDING go to tabs —
    // but keep pricing/onboarding reachable while signed in (upgrade + preferences flows).
    const onAuthLanding = inAuth && (segs[1] === 'login' || segs[1] === 'signup' || segs[1] === undefined);
    if (user && onAuthLanding) router.replace('/(tabs)');
  }, [user, loading, segments, router]);

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
      <Stack.Screen name="game/[id]" options={{ headerShown: false, presentation: 'card' }} />
      <Stack.Screen name="play" options={{ headerShown: false }} />
      <Stack.Screen name="community" options={{ headerShown: false }} />
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
