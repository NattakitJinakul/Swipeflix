/**
 * Tab bar — 5 tabs: ปัด (Swipe) · ค้นหา (Discover) · สนุก (Play) · รายการ (Watchlist) · โปรไฟล์ (Profile).
 * Rendered by AnimatedTabBar (Reanimated active pill + icon lift). See docs/06-design-ui.md.
 */
import { Tabs } from 'expo-router';

import { AnimatedTabBar } from '@/components/AnimatedTabBar';
import { useT } from '@/src/i18n';

export default function TabLayout() {
  const t = useT();
  return (
    <Tabs
      // AnimatedTabBar is absolutely positioned (out of the column flow) so screens render
      // full-height and content scrolls behind the glass; screens add TAB_BAR_CLEARANCE
      // bottom padding so their last item still clears the bar.
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <AnimatedTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: t('tabs.swipe') }} />
      <Tabs.Screen name="discover" options={{ title: t('tabs.discover') }} />
      <Tabs.Screen name="play" options={{ title: t('tabs.play') }} />
      <Tabs.Screen name="watchlist" options={{ title: t('tabs.watchlist') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
