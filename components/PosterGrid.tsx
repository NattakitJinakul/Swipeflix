/**
 * PosterGrid — FlatList grid of movie posters (watchlist / discover). Pure/props-driven.
 * expo-image with fade-in, rounded corners, subtle shadow. See docs/02-screens.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import type { MovieLite } from '@/src/types/movie';
import { posterUri } from './tmdb-image';

export type PosterGridProps = {
  movies: MovieLite[];
  onPress: (id: number) => void;
  numColumns?: number;
  ListEmptyComponent?: React.ComponentProps<typeof FlatList>['ListEmptyComponent'];
  ListHeaderComponent?: React.ComponentProps<typeof FlatList>['ListHeaderComponent'];
  contentContainerStyle?: React.ComponentProps<typeof FlatList>['contentContainerStyle'];
};

const GAP = 10;

export function PosterGrid({
  movies,
  onPress,
  numColumns = 3,
  ListEmptyComponent,
  ListHeaderComponent,
  contentContainerStyle,
}: PosterGridProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  const renderItem = ({ item }: ListRenderItemInfo<MovieLite>) => {
    const uri = posterUri(item.poster, 'w342');
    return (
      <Pressable
        style={({ pressed }) => [
          styles.cell,
          { flex: 1 / numColumns, opacity: pressed ? 0.75 : 1 },
        ]}
        onPress={() => onPress(item.id)}
      >
        <View style={[styles.poster, { backgroundColor: c.surface }]}>
          {uri ? (
            <Image
              source={{ uri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.noPoster}>
              <Ionicons name="film-outline" size={32} color={c.muted} />
              <Text style={[styles.noPosterText, { color: c.muted }]} numberOfLines={2}>
                {item.title}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <FlatList
      key={`cols-${numColumns}`}
      data={movies}
      keyExtractor={(m) => String(m.id)}
      numColumns={numColumns}
      renderItem={renderItem}
      columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
      ListEmptyComponent={ListEmptyComponent}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: GAP, gap: GAP },
  row: { gap: GAP },
  cell: {},
  poster: {
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  noPoster: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6 },
  noPosterText: { fontSize: 11, textAlign: 'center' },
});
