/**
 * Round colored action button (dislike / watched / like / undo) with press-scale spring.
 * Shared by the Swipe deck and the Movie detail floating bar.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pastel action palette shared by the Swipe deck + Movie detail bar. */
export const ACTION_COLORS = {
  dislike: '#FF8095', // soft coral
  watched: '#8FB8F6', // soft blue
  like: '#74D69E', // soft green
  undo: '#B7BDC8', // soft grey
};

/** Icons per action — cross replaced with a friendlier skip. */
export const ACTION_ICONS = {
  dislike: 'thumbs-down' as const,
  watched: 'eye' as const,
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
  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.82, { damping: 12 }))}
      onPressOut={() => (scale.value = withSpring(1, { damping: 10 }))}
      style={[
        styles.btn,
        anim,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity: disabled ? 0.4 : 1 },
      ]}
    >
      <Ionicons name={icon} size={Math.round(size * 0.46)} color="#fff" />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});
