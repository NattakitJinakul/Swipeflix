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
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';

type Tab = 'want' | 'played';
type Sort = 'recent' | 'year' | 'az';

const SORTS: { key: Sort; labelKey: string }[] = [
  { key: 'recent', labelKey: 'watchlist.sortRecent' },
  { key: 'year', labelKey: 'watchlist.sortYear' },
  { key: 'az', labelKey: 'watchlist.sortAz' },
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
  const t = useT();

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
      buttons.push({ text: t('watchlist.actionPlayed'), onPress: () => moveToPlayed(game) });
    }
    buttons.push({
      text: t('watchlist.actionRemove'),
      style: 'destructive',
      onPress: () => remove(id, tab === 'want' ? 'liked' : 'played'),
    });
    buttons.push({ text: t('common.cancel'), style: 'cancel' });
    Alert.alert(game.name, undefined, buttons);
  };

  const emptyComponent =
    isGuest && liked.length === 0 && played.length === 0 ? (
      <EmptyState
        icon="log-in-outline"
        title={t('watchlist.guestTitle')}
        subtitle={t('watchlist.guestSub')}
        actionLabel={t('common.signIn')}
        onAction={() => router.push('/(auth)/login')}
      />
    ) : (
      <EmptyState
        icon={tab === 'want' ? 'heart-outline' : 'game-controller-outline'}
        title={tab === 'want' ? t('watchlist.emptyWantTitle') : t('watchlist.emptyPlayedTitle')}
        subtitle={tab === 'want' ? t('watchlist.emptyWantSub') : t('watchlist.emptyPlayedSub')}
        actionLabel={t('watchlist.emptyCta')}
        onAction={() => router.push('/(tabs)')}
      />
    );

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>{t('watchlist.title')}</Text>
        <Pressable hitSlop={10} onPress={() => setEditing((e) => !e)}>
          <Text style={[styles.edit, { color: editing ? c.primary : c.muted }]}>
            {editing ? t('common.done') : t('watchlist.manage')}
          </Text>
        </Pressable>
      </View>

      {/* Segmented control */}
      <View style={[styles.segment, { backgroundColor: c.surface }]}>
        {(['want', 'played'] as Tab[]).map((seg) => (
          <Pressable
            key={seg}
            onPress={() => setTab(seg)}
            style={[styles.segmentItem, tab === seg && { backgroundColor: c.primary }]}
          >
            <Text style={[styles.segmentText, { color: tab === seg ? '#fff' : c.muted }]}>
              {seg === 'want'
                ? t('watchlist.tabWant', { n: liked.length })
                : t('watchlist.tabPlayed', { n: played.length })}
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
              {t(s.labelKey)}
            </Text>
          </Pressable>
        ))}
      </View>

      <PosterGrid items={data} numColumns={3} onPress={onPressItem} ListEmptyComponent={emptyComponent} />
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
