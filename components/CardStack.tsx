/**
 * CardStack — Reanimated swipe deck (Tinder-style). Pure/props-driven.
 * Top card drags + rotates on the UI thread (worklets); past threshold it flies off,
 * fires haptic + the matching callback. Shows up to 3 stacked cards; back cards sit
 * scaled/offset and grow toward the front as the top card leaves.
 * Uses the modern Gesture API (GestureDetector) per react-native-gesture-handler 2.28.
 * See docs/02-screens.md + docs/06-design-ui.md.
 */
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import type { MovieLite } from '@/src/types/movie';
import { SwipeCard } from './SwipeCard';

const { width: SCREEN_W } = Dimensions.get('window');
const SWIPE_X = SCREEN_W * 0.28; // horizontal fling distance to commit like/nope
const SWIPE_UP = 140; // upward fling distance to commit "seen"
const FLY = SCREEN_W * 1.4;

export type CardStackProps = {
  movies: MovieLite[];
  onSwipeLeft: (id: number) => void; // nope
  onSwipeRight: (movie: MovieLite) => void; // like
  onSwipeUp: (movie: MovieLite) => void; // seen
  onTapCard: (id: number) => void;
  /** Resolve a movie's genre ids to display names for the top card. */
  genresOf?: (movie: MovieLite) => string[];
};

export function CardStack({
  movies,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onTapCard,
  genresOf,
}: CardStackProps) {
  const [index, setIndex] = useState(0);

  const x = useSharedValue(0);
  const y = useSharedValue(0);

  // 0..1 progress of the top card away from center — drives back-card growth.
  const progress = useDerivedValue(() =>
    Math.min(1, Math.max(Math.abs(x.value) / SWIPE_X, Math.max(0, -y.value) / SWIPE_UP)),
  );

  const advance = useCallback(() => {
    x.value = 0;
    y.value = 0;
    setIndex((i) => i + 1);
  }, [x, y]);

  const fire = useCallback(
    (dir: 'left' | 'right' | 'up', movie: MovieLite) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (dir === 'left') onSwipeLeft(movie.id);
      else if (dir === 'right') onSwipeRight(movie);
      else onSwipeUp(movie);
    },
    [onSwipeLeft, onSwipeRight, onSwipeUp],
  );

  const topMovie = movies[index];

  const tap = Gesture.Tap()
    .maxDistance(10)
    .onEnd(() => {
      if (topMovie) runOnJS(onTapCard)(topMovie.id);
    });

  const pan = Gesture.Pan()
    .onChange((e) => {
      x.value += e.changeX;
      y.value += e.changeY;
    })
    .onEnd((e) => {
      const goRight = x.value > SWIPE_X || e.velocityX > 900;
      const goLeft = x.value < -SWIPE_X || e.velocityX < -900;
      const goUp = y.value < -SWIPE_UP || e.velocityY < -900;

      if (goUp && topMovie) {
        y.value = withTiming(-FLY, { duration: 260 });
        x.value = withTiming(x.value, { duration: 260 });
        runOnJS(fire)('up', topMovie);
        runOnJS(advance)();
      } else if (goRight && topMovie) {
        x.value = withTiming(FLY, { duration: 260 });
        runOnJS(fire)('right', topMovie);
        runOnJS(advance)();
      } else if (goLeft && topMovie) {
        x.value = withTiming(-FLY, { duration: 260 });
        runOnJS(fire)('left', topMovie);
        runOnJS(advance)();
      } else {
        x.value = withSpring(0);
        y.value = withSpring(0);
      }
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  const topStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
      { rotate: `${interpolate(x.value, [-SCREEN_W, SCREEN_W], [-14, 14], 'clamp')}deg` },
    ],
  }));

  // Second card grows/rises toward the front as the top card leaves.
  const secondStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.94, 1], 'clamp') },
      { translateY: interpolate(progress.value, [0, 1], [16, 0], 'clamp') },
    ],
  }));
  const thirdStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.88, 0.94], 'clamp') },
      { translateY: interpolate(progress.value, [0, 1], [32, 16], 'clamp') },
    ],
  }));

  // Render up to 3, back-to-front so the top card wins z-order.
  const third = movies[index + 2];
  const second = movies[index + 1];

  return (
    <View style={styles.root}>
      {third ? (
        <Animated.View style={[styles.cardWrap, thirdStyle]} pointerEvents="none">
          <SwipeCard movie={third} />
        </Animated.View>
      ) : null}
      {second ? (
        <Animated.View style={[styles.cardWrap, secondStyle]} pointerEvents="none">
          <SwipeCard movie={second} genres={genresOf?.(second)} />
        </Animated.View>
      ) : null}
      {topMovie ? (
        <GestureDetector gesture={gesture} key={topMovie.id}>
          <Animated.View style={[styles.cardWrap, topStyle]}>
            <SwipeCard movie={topMovie} genres={genresOf?.(topMovie)} dragX={x} dragY={y} />
          </Animated.View>
        </GestureDetector>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cardWrap: { ...StyleSheet.absoluteFillObject, margin: 12 },
});
