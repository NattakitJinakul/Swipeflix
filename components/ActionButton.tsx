/**
 * Round colored action button (dislike / played / like / undo). Solid vivid fill, white icon,
 * a COLORED glow shadow so it pops off the dark background, plus a glossy top highlight overlay.
 * Press = scale spring. Shared by the Swipe deck + the game detail floating bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Vivid action palette shared by the Swipe deck + game detail bar. */
export const ACTION_COLORS = {
  dislike: '#EF4444',
  watched: '#3B82F6',
  like: '#22C55E',
  undo: '#6B7280',
};

export const ACTION_ICONS = {
  dislike: 'thumbs-down' as const,
  watched: 'checkmark-done' as const,
  like: 'heart' as const,
  undo: 'arrow-undo' as const,
};

export function ActionButton({
  icon,
  color,
  onPress,
  disabled,
  size = 52,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress: () => void;
  disabled?: boolean;
  size?: number;
}) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const radius = size / 2;
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => (scale.value = withSpring(0.82, { damping: 12 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10 }))}
      style={[
        styles.btn,
        anim,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: color,
          shadowColor: color,
          opacity: disabled ? 0.45 : 1,
        },
      ]}
    >
      {/* Glossy top highlight, clipped to the circle. */}
      <View style={[StyleSheet.absoluteFill, { borderRadius: radius, overflow: 'hidden' }]} pointerEvents="none">
        <LinearGradient
          colors={['rgba(255,255,255,0.28)', 'rgba(255,255,255,0)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.gloss}
        />
      </View>
      <Ionicons name={icon} size={Math.round(size * 0.46)} color="#fff" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    // Colored glow (shadowColor set per-button to its own color).
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },
  gloss: { height: '55%' },
});
