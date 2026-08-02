/**
 * ReviewCard — landscape image tile for a recently-reviewed game: name + genre bottom-left,
 * a big % score bottom-right, over a dark gradient. Sized by the parent (bento grid) via `style`.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { gameImage } from '@/components/game-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { ReviewGame } from '@/src/types/game';

const scoreColor = (r: number) => (r >= 80 ? '#22C55E' : r >= 60 ? '#FBBF24' : '#EF4444');

export function ReviewCard({
  game,
  onPress,
  style,
  big,
}: {
  game: ReviewGame;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
}) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const uri = gameImage(game.image);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, { opacity: pressed ? 0.85 : 1 }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface }]} />
      )}
      <LinearGradient colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={styles.meta}>
        <View style={styles.metaText}>
          <Text numberOfLines={big ? 2 : 1} style={[styles.name, big && styles.nameBig]}>{game.name}</Text>
          {game.genre ? <Text numberOfLines={1} style={styles.genre}>{game.genre}</Text> : null}
        </View>
        <Text style={[styles.score, big && styles.scoreBig, { color: scoreColor(game.rating) }]}>
          {Math.round(game.rating)}%
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, overflow: 'hidden', justifyContent: 'flex-end', backgroundColor: '#000' },
  meta: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 12 },
  metaText: { flex: 1 },
  name: { color: '#fff', fontSize: 13, fontWeight: '800' },
  nameBig: { fontSize: 18 },
  genre: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600', marginTop: 2 },
  score: {
    fontSize: 20,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  scoreBig: { fontSize: 30 },
});
