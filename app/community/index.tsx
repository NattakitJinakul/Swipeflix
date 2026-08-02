/**
 * Community — browse/search other players. Guest-viewable (read-only). Firestore reads are
 * guarded in the helpers (return [] on unconfigured/empty DB), so this never crashes.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { listPublicProfiles, searchProfilesByName } from '@/src/firebase/profiles';
import { useT } from '@/src/i18n';
import type { PublicProfile } from '@/src/types/user';

export default function CommunityScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const [query, setQuery] = useState('');
  const [players, setPlayers] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Initial load — top players by liked count.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    listPublicProfiles(50)
      .then((list) => active && setPlayers(list))
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  // Debounced name search when the query is non-empty.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    let active = true;
    setLoading(true);
    const timer = setTimeout(() => {
      searchProfilesByName(q)
        .then((list) => active && setPlayers(list))
        .catch(() => active && setError(true))
        .finally(() => active && setLoading(false));
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  const searching = query.trim().length > 0;

  const renderItem = ({ item }: ListRenderItemInfo<PublicProfile>) => {
    const topGenre = item.topGenres[0]?.name;
    return (
      <Pressable
        onPress={() => router.push(`/community/${item.uid}`)}
        style={({ pressed }) => [styles.row, { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 }]}
      >
        <Avatar value={item.avatar} name={item.displayName} size={48} />
        <View style={styles.rowBody}>
          <Text style={[styles.rowName, { color: c.text }]} numberOfLines={1}>
            {item.displayName || '—'}
          </Text>
          <Text style={[styles.rowMeta, { color: c.muted }]} numberOfLines={1}>
            {topGenre ? `${topGenre} · ` : ''}
            {t('community.likedCount', { n: item.likedCount })}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={c.muted} />
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: c.surface }]}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder={t('community.searchPlaceholder')}
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

      {loading && players.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(p) => p.uid}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title={t('community.loadFailed')} />
            ) : searching ? (
              <EmptyState icon="search-outline" title={t('community.noResults')} />
            ) : (
              <EmptyState
                icon="people-outline"
                title={t('community.emptyTitle')}
                subtitle={t('community.emptySub')}
              />
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
  },
  rowBody: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowMeta: { fontSize: 13 },
});
