/**
 * Discover screen — search box on top (useSearch, debounced). No query -> Trending grid
 * (IG-explore vibe); with query -> results grid. Tap opens detail. See docs/02 + docs/11.
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
import { trending } from '@/src/api/endpoints';
import { useSearch } from '@/src/hooks/useSearch';
import type { MovieLite } from '@/src/types/movie';

export default function DiscoverScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { query, setQuery, results, loading } = useSearch();
  const [trend, setTrend] = useState<MovieLite[]>([]);
  const [trendLoading, setTrendLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setTrendLoading(true);
    trending('week')
      .then((paged) => active && setTrend(paged.results))
      .catch(() => active && setTrend([]))
      .finally(() => active && setTrendLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const searching = query.trim().length > 0;
  const busy = searching ? loading : trendLoading;
  const data = searching ? results : trend;
  const openDetail = (id: number) => router.push(`/movie/${id}`);

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: c.surface }]}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder="ค้นหาหนัง..."
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
        <Text style={[styles.sectionLabel, { color: c.muted }]}>🔥 กำลังมาแรงสัปดาห์นี้</Text>
      ) : null}

      {busy && data.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : (
        <PosterGrid
          movies={data}
          numColumns={3}
          onPress={openDetail}
          ListEmptyComponent={
            searching ? (
              <EmptyState
                icon="search-outline"
                title="ไม่พบผลลัพธ์"
                subtitle={`ไม่เจอหนังที่ตรงกับ "${query}"`}
              />
            ) : (
              <EmptyState icon="flame-outline" title="โหลดหนังไม่สำเร็จ" subtitle="ลองใหม่อีกครั้ง" />
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
  sectionLabel: { fontSize: 14, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
