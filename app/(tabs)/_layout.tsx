/**
 * Tab bar — 4 tabs: ปัด (Swipe) · ค้นหา (Discover) · รายการ (Watchlist) · โปรไฟล์ (Profile).
 * Ionicons flip filled<->outline on focus; HapticTab adds press haptic. Dark + light via
 * Colors + use-color-scheme. See docs/02-screens.md + docs/06-design-ui.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const icon = (base: IoniconName, filled: IoniconName) => {
  const TabIcon = ({ color, focused, size }: { color: string; focused: boolean; size: number }) => (
    <Ionicons name={focused ? filled : base} size={size ?? 26} color={color} />
  );
  TabIcon.displayName = `TabIcon(${base})`;
  return TabIcon;
};

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: {
          backgroundColor: c.background,
          borderTopColor: c.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ปัด', tabBarIcon: icon('flame-outline', 'flame') }}
      />
      <Tabs.Screen
        name="discover"
        options={{ title: 'ค้นหา', tabBarIcon: icon('search-outline', 'search') }}
      />
      <Tabs.Screen
        name="watchlist"
        options={{ title: 'รายการ', tabBarIcon: icon('bookmark-outline', 'bookmark') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'โปรไฟล์', tabBarIcon: icon('person-outline', 'person') }}
      />
    </Tabs>
  );
}
