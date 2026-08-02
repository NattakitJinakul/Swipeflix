/**
 * Discover screen — search box on top (useSearch, debounced). No query -> popular grid
 * (with a ยอดนิยม / คะแนนสูง toggle); with query -> results grid. Tap opens game detail.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PosterGrid } from '@/components/PosterGrid';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { popularGames, topRatedGames } from '@/src/api/endpoints';
import { useSearch } from '@/src/hooks/useSearch';
import type { GameLite } from '@/src/types/game';

type Feed = 'popular' | 'top_rated';

const FEEDS: { key: Feed; label: string }[] = [
  { key: 'popular', label: '🔥 ยอดนิยม' },
  { key: 'top_rated', label: '✨ แนะนำ' },
];

export default function DiscoverScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { query, setQuery, results, loading } = useSearch();
  const [feed, setFeed] = useState<Feed>('popular');
  const [grid, setGrid] = useState<GameLite[]>([]);
  const [gridLoading, setGridLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setGridLoading(true);
    const fetch = feed === 'popular' ? popularGames() : topRatedGames();
    fetch
      .then((paged) => active && setGrid(paged.results))
      .catch(() => active && setGrid([]))
      .finally(() => active && setGridLoading(false));
    return () => {
      active = false;
    };
  }, [feed]);

  const searching = query.trim().length > 0;
  const busy = searching ? loading : gridLoading;
  const data = searching ? results : grid;
  const openDetail = (id: number) => router.push(`/game/${id}`);

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: c.surface }]}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder="ค้นหาเกม..."
          placeholderTextColor={c.muted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {query.length > 0 ? (
          <Pressable hitSlop={8} onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={c.muted} />
          </Pressable>
        ) : null}
      </View>

      {!searching ? (
        <View style={styles.feedRow}>
          {FEEDS.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => setFeed(f.key)}
              style={[styles.feedChip, { backgroundColor: feed === f.key ? c.primary : c.surface }]}
            >
              <Text style={[styles.feedText, { color: feed === f.key ? '#fff' : c.muted }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {busy && data.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : (
        <PosterGrid
          items={data}
          numColumns={3}
          onPress={openDetail}
          ListEmptyComponent={
            searching ? (
              <EmptyState
                icon="search-outline"
                title="ไม่พบผลลัพธ์"
                subtitle={`ไม่เจอเกมที่ตรงกับ "${query}"`}
              />
            ) : (
              <EmptyState icon="flame-outline" title="โหลดเกมไม่สำเร็จ" subtitle="ลองใหม่อีกครั้ง" />
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  feedRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  feedChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  feedText: { fontSize: 13, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
