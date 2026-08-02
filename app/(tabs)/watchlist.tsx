/**
 * Watchlist screen — segmented "อยากเล่น | เล่นแล้ว" over PosterGrid, with sort
 * (เพิ่งเพิ่ม / คะแนน / A-Z) and item actions (remove; move liked -> played).
 * Tap opens game detail; an Edit toggle turns taps into an action menu.
 * Guests can't save — an empty library prompts login.
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
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';

type Tab = 'want' | 'played';
type Sort = 'recent' | 'year' | 'az';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'recent', label: 'เพิ่งเพิ่ม' },
  { key: 'year', label: 'ปีล่าสุด' },
  { key: 'az', label: 'A-Z' },
];

function sortGames(list: GameLite[], sort: Sort): GameLite[] {
  if (sort === 'recent') return list; // store keeps newest-first
  const copy = [...list];
  if (sort === 'year') return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
  return copy.sort((a, b) => a.name.localeCompare(b.name));
}

export default function WatchlistScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { isGuest } = useAuth();
  const { liked, played, remove, moveToPlayed } = useLibrary();
  const [tab, setTab] = useState<Tab>('want');
  const [sort, setSort] = useState<Sort>('recent');
  const [editing, setEditing] = useState(false);

  const source = tab === 'want' ? liked : played;
  const data = useMemo(() => sortGames(source, sort), [source, sort]);

  const onPressItem = (id: number) => {
    if (!editing) {
      router.push(`/game/${id}`);
      return;
    }
    const game = source.find((g) => g.id === id);
    if (!game) return;

    const buttons: { text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }[] = [];
    if (tab === 'want') {
      buttons.push({ text: 'เล่นแล้ว', onPress: () => moveToPlayed(game) });
    }
    buttons.push({
      text: 'ลบออก',
      style: 'destructive',
      onPress: () => remove(id, tab === 'want' ? 'liked' : 'played'),
    });
    buttons.push({ text: 'ยกเลิก', style: 'cancel' });
    Alert.alert(game.name, undefined, buttons);
  };

  const emptyComponent =
    isGuest && liked.length === 0 && played.length === 0 ? (
      <EmptyState
        icon="log-in-outline"
        title="เข้าสู่ระบบเพื่อบันทึกเกม"
        subtitle="เข้าสู่ระบบเพื่อเก็บเกมที่อยากเล่นและที่เล่นแล้วไว้ที่นี่"
        actionLabel="เข้าสู่ระบบ"
        onAction={() => router.push('/(auth)/login')}
      />
    ) : (
      <EmptyState
        icon={tab === 'want' ? 'heart-outline' : 'game-controller-outline'}
        title={tab === 'want' ? 'ยังไม่มีเกมที่อยากเล่น' : 'ยังไม่มีเกมที่เล่นแล้ว'}
        subtitle={
          tab === 'want'
            ? 'ปัดขวาเกมที่ชอบในหน้า Swipe เพื่อเก็บไว้ที่นี่'
            : 'ทำเครื่องหมาย "เล่นแล้ว" จากหน้า Swipe หรือ watchlist'
        }
        actionLabel="ไปปัดเกม"
        onAction={() => router.push('/(tabs)')}
      />
    );

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>รายการเกม</Text>
        <Pressable hitSlop={10} onPress={() => setEditing((e) => !e)}>
          <Text style={[styles.edit, { color: editing ? c.primary : c.muted }]}>
            {editing ? 'เสร็จ' : 'จัดการ'}
          </Text>
        </Pressable>
      </View>

      {/* Segmented control */}
      <View style={[styles.segment, { backgroundColor: c.surface }]}>
        {(['want', 'played'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentItem, tab === t && { backgroundColor: c.primary }]}
          >
            <Text style={[styles.segmentText, { color: tab === t ? '#fff' : c.muted }]}>
              {t === 'want' ? `อยากเล่น (${liked.length})` : `เล่นแล้ว (${played.length})`}
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

      <PosterGrid items={data} numColumns={2} onPress={onPressItem} ListEmptyComponent={emptyComponent} />
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
