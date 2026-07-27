/**
 * Settings stack. Index + grouped sub-pages. Native header, back-enabled.
 * See docs/10-profile-settings.md.
 */
import { Stack } from 'expo-router';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.background },
        headerTitleStyle: { color: c.text },
        headerTintColor: c.primary,
        contentStyle: { backgroundColor: c.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'ตั้งค่า' }} />
      <Stack.Screen name="account" options={{ title: 'บัญชี' }} />
      <Stack.Screen name="subscription" options={{ title: 'สมาชิก' }} />
      <Stack.Screen name="preferences" options={{ title: 'ค่ากำหนด' }} />
      <Stack.Screen name="about" options={{ title: 'เกี่ยวกับ' }} />
    </Stack>
  );
}
