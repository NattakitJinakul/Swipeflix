/**
 * Community stack. Index (player list) + [uid] (a player's public profile).
 * Native themed header; pushed from the root stack, so the index gets an explicit back control.
 */
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { Pressable } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

export default function CommunityLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTitleStyle: { color: c.text },
        headerTintColor: c.primary,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: t('community.title'),
          headerLeft: () => (
            <Pressable onPress={() => router.back()} hitSlop={10} style={{ paddingHorizontal: 4 }}>
              <Ionicons name="chevron-back" size={26} color={c.primary} />
            </Pressable>
          ),
        }}
      />
      <Stack.Screen name="[uid]" options={{ title: t('community.title') }} />
    </Stack>
  );
}
