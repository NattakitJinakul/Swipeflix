/**
 * Tab bar — 5 tabs: ปัด (Swipe) · ค้นหา (Discover) · สนุก (Play) · รายการ (Watchlist) · โปรไฟล์ (Profile).
 * Rendered by AnimatedTabBar (Reanimated active pill + icon lift). See docs/06-design-ui.md.
 */
import { Tabs } from 'expo-router';

import { AnimatedTabBar } from '@/components/AnimatedTabBar';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'ปัด' }} />
      <Tabs.Screen name="discover" options={{ title: 'ค้นหา' }} />
      <Tabs.Screen name="play" options={{ title: 'สนุก' }} />
      <Tabs.Screen name="watchlist" options={{ title: 'รายการ' }} />
      <Tabs.Screen name="profile" options={{ title: 'โปรไฟล์' }} />
    </Tabs>
  );
}
