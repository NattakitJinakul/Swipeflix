/**
 * Premium floating glass tab bar: a frosted rounded pill (expo-blur + surface tint + top hairline
 * highlight), a gradient indicator pill that springs behind the active tab with a colored glow, and
 * icons that scale + turn white when active. The active tab also reveals its label. Haptic on tap.
 * Routing stays with expo-router Tabs; this only replaces the bar's look. In-flow (reserves space).
 */
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { outline: IoniconName; filled: IoniconName; labelKey: string }> = {
  index: { outline: 'flame-outline', filled: 'flame', labelKey: 'tabs.swipe' },
  discover: { outline: 'search-outline', filled: 'search', labelKey: 'tabs.discover' },
  play: { outline: 'game-controller-outline', filled: 'game-controller', labelKey: 'tabs.play' },
  watchlist: { outline: 'bookmark-outline', filled: 'bookmark', labelKey: 'tabs.watchlist' },
  profile: { outline: 'person-outline', filled: 'person', labelKey: 'tabs.profile' },
};

const BAR_H = 62;
const PILL = 46;

/**
 * Vertical space the floating bar occupies above the safe-area inset (fade runway + bar + gap).
 * Scrollable tab screens add `insets.bottom + TAB_BAR_CLEARANCE` as paddingBottom so their last
 * content clears the bar instead of sliding under it.
 */
export const TAB_BAR_CLEARANCE = 96;

export function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();
  const [barW, setBarW] = useState(0);

  const count = state.routes.length;
  const tabW = barW ? barW / count : 0;

  const pos = useSharedValue(state.index);
  useEffect(() => {
    pos.value = withSpring(state.index, { damping: 15, stiffness: 170, mass: 0.7 });
  }, [state.index, pos]);

  // Center a PILL-wide indicator within the active tab slot.
  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: pos.value * tabW + (tabW - PILL) / 2 }],
  }));

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      {/* Fade scrim: scrolling content dissolves into the background before it reaches the bar,
          and the side margins beside the pill stay solid so nothing peeks through. */}
      <LinearGradient
        colors={['transparent', c.background, c.background]}
        locations={[0, 0.62, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />
      <View style={[styles.bar, { shadowColor: '#000' }]} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
        {/* Clipped glass layer — opaque base under the blur kills any content bleed-through */}
        <View style={styles.clip} pointerEvents="none">
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface }]} />
          <BlurView intensity={scheme === 'dark' ? 30 : 45} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: scheme === 'dark' ? 'rgba(22,22,29,0.94)' : 'rgba(244,244,246,0.94)' },
            ]}
          />
          <View style={styles.hairline} />
        </View>

        {/* Sliding gradient indicator pill (glows; sits behind the active icon) */}
        {tabW > 0 ? (
          <Animated.View style={[styles.indicatorWrap, indicatorStyle]} pointerEvents="none">
            <LinearGradient
              colors={[c.primary, '#FF5A67']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.indicator, { shadowColor: c.primary }]}
            />
          </Animated.View>
        ) : null}

        {state.routes.map((route, i) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === i;
          const onPress = () => {
            Haptics.selectionAsync().catch(() => {});
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };
          return (
            <TabItem key={route.key} focused={focused} cfg={cfg} label={t(cfg.labelKey)} muted={c.muted} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  focused,
  cfg,
  label,
  muted,
  onPress,
}: {
  focused: boolean;
  cfg: { outline: IoniconName; filled: IoniconName; labelKey: string };
  label: string;
  muted: string;
  onPress: () => void;
}) {
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.14 : 1, { damping: 13, stiffness: 180 }) }],
  }));
  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={8} accessibilityLabel={label}>
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? cfg.filled : cfg.outline} size={25} color={focused ? '#fff' : muted} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 24, alignItems: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: BAR_H,
    borderRadius: 999,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 16,
  },
  clip: { ...StyleSheet.absoluteFillObject, borderRadius: 999, overflow: 'hidden' },
  hairline: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: BAR_H },
  indicatorWrap: {
    position: 'absolute',
    top: (BAR_H - PILL) / 2,
    left: 0,
    width: PILL,
    height: PILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicator: {
    width: PILL,
    height: PILL,
    borderRadius: PILL / 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 10,
  },
});
