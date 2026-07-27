/**
 * SwipeCard — single presentational movie card (poster, rating, title, year, genres).
 * Pure/props-driven: no data fetching, no store. Overlay labels LIKE/NOPE/SEEN
 * fade in with drag distance when the parent passes `dragX`/`dragY` shared values.
 * See docs/06-design-ui.md + docs/02-screens.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MovieLite } from '@/src/types/movie';
import { posterUri } from './tmdb-image';

export type SwipeCardProps = {
  movie: MovieLite;
  /** Genre display names (parent resolves ids -> names). */
  genres?: string[];
  /** Horizontal drag offset of the top card, in px. Drives LIKE / NOPE overlays. */
  dragX?: SharedValue<number>;
  /** Vertical drag offset of the top card, in px. Negative (up) drives SEEN overlay. */
  dragY?: SharedValue<number>;
  /** px of drag that fully reveals an overlay label. */
  swipeThreshold?: number;
};

export function SwipeCard({
  movie,
  genres,
  dragX,
  dragY,
  swipeThreshold = 120,
}: SwipeCardProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  // Fallback shared values so hooks stay unconditional when the card is static (back of stack).
  const fallbackX = useSharedValue(0);
  const fallbackY = useSharedValue(0);
  const x = dragX ?? fallbackX;
  const y = dragY ?? fallbackY;

  const likeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [10, swipeThreshold], [0, 1], 'clamp'),
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-swipeThreshold, -10], [1, 0], 'clamp'),
  }));
  const seenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-swipeThreshold, -10], [1, 0], 'clamp'),
  }));

  const uri = posterUri(movie.poster, 'w500');

  return (
    <View style={[styles.card, { backgroundColor: c.surface }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.noPoster, { backgroundColor: c.surface }]}>
          <Ionicons name="film-outline" size={64} color={c.muted} />
        </View>
      )}

      {/* bottom scrim for legible text over poster */}
      <View style={styles.scrim} pointerEvents="none" />

      {/* rating badge */}
      <View style={[styles.ratingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <Ionicons name="star" size={13} color="#F5C518" />
        <Text style={styles.ratingText}>{movie.rating.toFixed(1)}</Text>
      </View>

      {/* title + meta */}
      <View style={styles.info} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          {movie.title}
          {movie.year ? <Text style={styles.year}>{`  (${movie.year})`}</Text> : null}
        </Text>
        {genres && genres.length > 0 ? (
          <View style={styles.chipRow}>
            {genres.slice(0, 3).map((g) => (
              <View key={g} style={styles.chip}>
                <Text style={styles.chipText}>{g}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* swipe overlays */}
      <Animated.View style={[styles.overlay, styles.overlayLeft, likeStyle]} pointerEvents="none">
        <Text style={[styles.overlayLabel, { color: c.like, borderColor: c.like }]}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.overlayRight, nopeStyle]} pointerEvents="none">
        <Text style={[styles.overlayLabel, { color: c.dislike, borderColor: c.dislike }]}>NOPE</Text>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.overlayTop, seenStyle]} pointerEvents="none">
        <Text style={[styles.overlayLabel, { color: c.watched, borderColor: c.watched }]}>SEEN</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  noPoster: { alignItems: 'center', justifyContent: 'center' },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  info: { position: 'absolute', left: 16, right: 16, bottom: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '800' },
  year: { fontSize: 18, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  overlay: { position: 'absolute', top: 28 },
  overlayLeft: { left: 20 },
  overlayRight: { right: 20 },
  overlayTop: { alignSelf: 'center', top: '42%' },
  overlayLabel: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 4,
    borderRadius: 10,
    transform: [{ rotate: '-12deg' }],
  },
});
