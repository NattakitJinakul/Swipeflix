/**
 * Browse-by screen — lists games filtered by a genre / platform / company, reached by tapping
 * those refs on the game detail screen. Company browse also shows the company's logo + description.
 * Paged (loads more on end reached). Guest-friendly. Route: /browse/[kind]/[id]?name=...
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  companyInfo,
  gamesByCompany,
  gamesByGenre,
  gamesByPlatform,
  type PagedLite,
} from '@/src/api/endpoints';
import { useT } from '@/src/i18n';
import type { CompanyInfo, GameLite } from '@/src/types/game';

type Kind = 'genre' | 'platform' | 'company';

const fetchByKind = (kind: Kind, id: number, page: number): Promise<PagedLite> => {
  if (kind === 'platform') return gamesByPlatform(id, page);
  if (kind === 'company') return gamesByCompany(id, page);
  return gamesByGenre(id, page);
};

export default function BrowseScreen() {
  const params = useLocalSearchParams<{ kind: string; id: string; name?: string }>();
  const kind = (params.kind as Kind) ?? 'genre';
  const id = Number(params.id);
  const name = params.name ?? '';

  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const [items, setItems] = useState<GameLite[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [company, setCompany] = useState<CompanyInfo | null>(null);

  const subtitle =
    kind === 'platform'
      ? t('browse.subPlatform', { name })
      : kind === 'company'
        ? t('browse.subCompany', { name })
        : t('browse.subGenre', { name });

  // Initial load (+ company info when browsing a company).
  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError(true);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(false);
    if (kind === 'company') {
      companyInfo(id).then((info) => active && setCompany(info)).catch(() => {});
    }
    fetchByKind(kind, id, 0)
      .then((paged) => {
        if (!active) return;
        setItems(paged.results);
        setPage(0);
        setHasMore(paged.hasMore);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [kind, id]);

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore || error) return;
    setLoadingMore(true);
    fetchByKind(kind, id, page + 1)
      .then((paged) => {
        setItems((prev) => [...prev, ...paged.results]);
        setPage(paged.page);
        setHasMore(paged.hasMore);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [kind, id, page, hasMore, loadingMore, loading, error]);

  const renderItem = ({ item }: ListRenderItemInfo<GameLite>) => (
    <Pressable
      onPress={() => router.push(`/game/${item.id}`)}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.75 : 1 }]}
    >
      <View style={[styles.poster, { backgroundColor: c.surface }]}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" />
        ) : (
          <View style={styles.noPoster}>
            <Ionicons name="game-controller-outline" size={30} color={c.muted} />
            <Text style={[styles.noPosterText, { color: c.muted }]} numberOfLines={2}>{item.name}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );

  const listHeader = (
    <View style={styles.head}>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>{name}</Text>
      <Text style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text>
      {kind === 'company' && company?.description ? (
        <View style={[styles.aboutCard, { backgroundColor: c.surface }]}>
          <View style={styles.aboutRow}>
            {company.logo ? (
              <Image source={{ uri: company.logo }} style={styles.logo} contentFit="contain" />
            ) : null}
            <Text style={[styles.aboutLabel, { color: c.text }]}>{t('browse.about')}</Text>
          </View>
          <Text style={[styles.aboutText, { color: c.muted }]} numberOfLines={6}>{company.description}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 6 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.text }]} numberOfLines={1}>{name}</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : error ? (
        <EmptyState icon="cloud-offline-outline" title={t('browse.loadFailed')} subtitle={t('common.tryAgain')} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(g) => String(g.id)}
          numColumns={3}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{ padding: 10, paddingBottom: insets.bottom + 24, gap: 10 }}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState icon="search-outline" title={t('browse.empty')} />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={c.primary} /> : null}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 6 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '800' },
  head: { paddingHorizontal: 6, paddingBottom: 12, gap: 4 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  aboutCard: { borderRadius: 14, padding: 14, gap: 8, marginTop: 10 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 40, height: 24 },
  aboutLabel: { fontSize: 15, fontWeight: '800' },
  aboutText: { fontSize: 13, lineHeight: 19 },
  row: { gap: 10 },
  cell: { flex: 1 / 3 },
  poster: {
    aspectRatio: 3 / 4,
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
  footer: { paddingVertical: 20 },
});
