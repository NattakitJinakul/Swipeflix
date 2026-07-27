/**
 * Watchlist screen — segmented "อยากดู | เคยดูแล้ว" over PosterGrid, with sort
 * (เพิ่งเพิ่ม / เรตติ้ง / A-Z) and item actions (remove; move liked -> watched).
 * Tap opens detail; an Edit toggle turns taps into an action menu. See docs/02 + docs/11.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { PosterGrid } from '@/components/PosterGrid';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLibrary } from '@/src/store/library';
import type { MovieLite } from '@/src/types/movie';

type Tab = 'want' | 'seen';
type Sort = 'recent' | 'rating' | 'az';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'recent', label: 'เพิ่งเพิ่ม' },
  { key: 'rating', label: 'เรตติ้ง' },
  { key: 'az', label: 'A-Z' },
];

function sortMovies(list: MovieLite[], sort: Sort): MovieLite[] {
  if (sort === 'recent') return list; // store keeps newest-first
  const copy = [...list];
  if (sort === 'rating') return copy.sort((a, b) => b.rating - a.rating);
  return copy.sort((a, b) => a.title.localeCompare(b.title));
}

export default function WatchlistScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { liked, watched, remove, moveToWatched } = useLibrary();
  const [tab, setTab] = useState<Tab>('want');
  const [sort, setSort] = useState<Sort>('recent');
  const [editing, setEditing] = useState(false);

  const source = tab === 'want' ? liked : watched;
  const data = useMemo(() => sortMovies(source, sort), [source, sort]);

  const onPressItem = (id: number) => {
    if (!editing) {
      router.push(`/movie/${id}`);
      return;
    }
    const movie = source.find((m) => m.id === id);
    if (!movie) return;

    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (tab === 'want') {
      buttons.push({ text: 'ดูแล้ว', onPress: () => moveToWatched(movie) });
    }
    buttons.push({
      text: 'ลบออก',
      style: 'destructive',
      onPress: () => remove(id, tab === 'want' ? 'liked' : 'watched'),
    });
    buttons.push({ text: 'ยกเลิก', style: 'cancel' });
    Alert.alert(movie.title, undefined, buttons);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Watchlist</Text>
        <Pressable hitSlop={10} onPress={() => setEditing((e) => !e)}>
          <Text style={[styles.edit, { color: editing ? c.primary : c.muted }]}>
            {editing ? 'เสร็จ' : 'จัดการ'}
          </Text>
        </Pressable>
      </View>

      {/* Segmented control */}
      <View style={[styles.segment, { backgroundColor: c.surface }]}>
        {(['want', 'seen'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentItem, tab === t && { backgroundColor: c.primary }]}
          >
            <Text style={[styles.segmentText, { color: tab === t ? '#fff' : c.muted }]}>
              {t === 'want' ? `อยากดู (${liked.length})` : `เคยดูแล้ว (${watched.length})`}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Sort control */}
      <View style={styles.sortRow}>
        <Ionicons name="swap-vertical" size={16} color={c.muted} />
        {SORTS.map((s) => (
          <Pressable key={s.key} onPress={() => setSort(s.key)} hitSlop={6}>
            <Text
              style={[
                styles.sortText,
                { color: sort === s.key ? c.primary : c.muted, fontWeight: sort === s.key ? '800' : '600' },
              ]}
            >
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <PosterGrid
        movies={data}
        numColumns={3}
        onPress={onPressItem}
        ListEmptyComponent={
          <EmptyState
            icon={tab === 'want' ? 'heart-outline' : 'eye-outline'}
            title={tab === 'want' ? 'ยังไม่มีหนังที่อยากดู' : 'ยังไม่มีหนังที่ดูแล้ว'}
            subtitle={
              tab === 'want'
                ? 'ปัดขวาหนังที่ชอบในหน้า Swipe เพื่อเก็บไว้ที่นี่'
                : 'ทำเครื่องหมาย "ดูแล้ว" จากหน้า Swipe หรือ watchlist'
            }
            actionLabel="ไปปัดหนัง"
            onAction={() => router.push('/(tabs)')}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: { fontSize: 26, fontWeight: '900' },
  edit: { fontSize: 15, fontWeight: '700' },
  segment: {
    flexDirection: 'row',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segmentText: { fontSize: 14, fontWeight: '700' },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortText: { fontSize: 13 },
});
