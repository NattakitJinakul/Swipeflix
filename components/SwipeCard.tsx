/**
 * SwipeCard — single presentational game card (cover, rating, title, year, genres).
 * Pure/props-driven: no data fetching, no store. Overlay labels LIKE/NOPE/SEEN
 * fade in with drag distance when the parent passes `dragX`/`dragY` shared values.
 * See docs/06-design-ui.md + docs/02-screens.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { GameLite } from '@/src/types/game';
import { gameImage } from './game-image';

export type SwipeCardProps = {
  game: GameLite;
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
  game,
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
    transform: [
      { rotate: '-12deg' },
      { scale: interpolate(x.value, [10, swipeThreshold], [0.6, 1], 'clamp') },
    ],
  }));
  const nopeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-swipeThreshold, -10], [1, 0], 'clamp'),
    transform: [
      { rotate: '12deg' },
      { scale: interpolate(x.value, [-swipeThreshold, -10], [1, 0.6], 'clamp') },
    ],
  }));
  const seenStyle = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [-swipeThreshold, -10], [1, 0], 'clamp'),
    transform: [{ scale: interpolate(y.value, [-swipeThreshold, -10], [1, 0.6], 'clamp') }],
  }));

  const uri = gameImage(game.image);

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
          <Ionicons name="game-controller-outline" size={64} color={c.muted} />
        </View>
      )}

      {/* bottom gradient scrim for legible text over poster (fades, no hard block) */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.35)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.55, 1]}
        style={styles.scrim}
        pointerEvents="none"
      />

      {/* rating + genre badges */}
      <View style={styles.topBadges} pointerEvents="none">
        {game.rating != null ? (
          <View style={[styles.ratingBadge, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
            <Ionicons name="star" size={13} color="#F5C518" />
            <Text style={styles.ratingText}>{`${Math.round(game.rating)}/100`}</Text>
          </View>
        ) : null}
        {game.genre ? (
          <View style={styles.mcPill}>
            <Text style={styles.mcText}>{game.genre}</Text>
          </View>
        ) : null}
      </View>

      {/* title + meta */}
      <View style={styles.info} pointerEvents="none">
        <Text style={styles.title} numberOfLines={2}>
          {game.name}
          {game.year ? <Text style={styles.year}>{`  (${game.year})`}</Text> : null}
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

      {/* swipe overlays — filled badges */}
      <Animated.View style={[styles.overlay, styles.overlayLeft, likeStyle]} pointerEvents="none">
        <View style={[styles.badge, { backgroundColor: c.like }]}>
          <Ionicons name="heart" size={22} color="#fff" />
          <Text style={styles.badgeText}>ชอบ</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.overlayRight, nopeStyle]} pointerEvents="none">
        <View style={[styles.badge, { backgroundColor: c.dislike }]}>
          <Ionicons name="thumbs-down" size={22} color="#fff" />
          <Text style={styles.badgeText}>ไม่ชอบ</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.overlay, styles.overlayTop, seenStyle]} pointerEvents="none">
        <View style={[styles.badge, { backgroundColor: c.watched }]}>
          <Ionicons name="game-controller" size={22} color="#fff" />
          <Text style={styles.badgeText}>เคยเล่น</Text>
        </View>
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
    height: '42%',
  },
  topBadges: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
  },
  ratingText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  mcPill: {
    backgroundColor: '#66CC33',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  mcText: { color: '#0A2200', fontWeight: '800', fontSize: 12 },
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
  overlay: { position: 'absolute', top: 34 },
  overlayLeft: { left: 22 },
  overlayRight: { right: 22 },
  overlayTop: { alignSelf: 'center', top: '40%' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  badgeText: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
});
