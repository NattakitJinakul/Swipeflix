/**
 * Premium floating tab bar: frosted-glass (expo-blur) rounded pill, a gradient indicator
 * that springs between tabs, and icons that scale + turn white when active. Haptic on tap.
 * Routing stays with expo-router Tabs; this only replaces the bar's look.
 */
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TABS: Record<string, { outline: IoniconName; filled: IoniconName; label: string }> = {
  index: { outline: 'flame-outline', filled: 'flame', label: 'ปัด' },
  discover: { outline: 'search-outline', filled: 'search', label: 'ค้นหา' },
  watchlist: { outline: 'bookmark-outline', filled: 'bookmark', label: 'รายการ' },
  profile: { outline: 'person-outline', filled: 'person', label: 'โปรไฟล์' },
};

export function AnimatedTabBar({ state, navigation }: BottomTabBarProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const [barW, setBarW] = useState(0);

  const count = state.routes.length;
  const tabW = barW ? barW / count : 0;

  const pos = useSharedValue(state.index);
  useEffect(() => {
    pos.value = withSpring(state.index, { damping: 16, stiffness: 180, mass: 0.7 });
  }, [state.index, pos]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: pos.value * tabW }] }));

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8, backgroundColor: c.background }]}>
      <View style={styles.bar} onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
        <BlurView intensity={scheme === 'dark' ? 40 : 60} tint={scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: scheme === 'dark' ? 'rgba(22,22,29,0.7)' : 'rgba(244,244,246,0.7)' }]} />

        {/* Sliding gradient indicator behind the active tab */}
        {tabW > 0 ? (
          <Animated.View style={[styles.indicatorWrap, { width: tabW }, indicatorStyle]} pointerEvents="none">
            <LinearGradient
              colors={[c.primary, '#FF5A67']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.indicator}
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
            <TabItem key={route.key} focused={focused} cfg={cfg} muted={c.muted} onPress={onPress} />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  focused,
  cfg,
  muted,
  onPress,
}: {
  focused: boolean;
  cfg: { outline: IoniconName; filled: IoniconName; label: string };
  muted: string;
  onPress: () => void;
}) {
  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(focused ? 1.18 : 1, { damping: 13, stiffness: 180 }) }],
  }));
  return (
    <Pressable style={styles.item} onPress={onPress} hitSlop={8} accessibilityLabel={cfg.label}>
      <Animated.View style={iconStyle}>
        <Ionicons name={focused ? cfg.filled : cfg.outline} size={24} color={focused ? '#fff' : muted} />
      </Animated.View>
    </Pressable>
  );
}

const BAR_H = 56;

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 28, paddingTop: 2, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: BAR_H,
    borderRadius: BAR_H / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 16,
    elevation: 14,
  },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', height: BAR_H },
  indicatorWrap: { position: 'absolute', height: BAR_H, alignItems: 'center', justifyContent: 'center' },
  indicator: { width: 44, height: 44, borderRadius: 22 },
});
