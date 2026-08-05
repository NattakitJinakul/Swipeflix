/**
 * Discover — search on top; with a query it shows the results grid, otherwise a rich BENTO feed:
 * Game of the Day hero, "Most Anticipated" countdown grid, and a "Recent Reviews" bento wall.
 * Guest-friendly. Loading skeletons + error/empty states. i18n throughout.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_CLEARANCE } from '@/components/AnimatedTabBar';
import { CountdownCard } from '@/components/CountdownCard';
import { EmptyState } from '@/components/EmptyState';
import { gameImage } from '@/components/game-image';
import { PosterGrid } from '@/components/PosterGrid';
import { ReviewCard } from '@/components/ReviewCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { gameOfDay, popularGames, recentReviews, upcomingGames } from '@/src/api/endpoints';
import { useSearch } from '@/src/hooks/useSearch';
import { useT } from '@/src/i18n';
import type { GameLite, ReviewGame, UpcomingGame } from '@/src/types/game';

const { width: W } = Dimensions.get('window');
const HPAD = 16;
const GAP = 10;
const SMALL_H = 116;
const LARGE_H = 172;

const open = (id: number) => router.push(`/game/${id}`);

export default function DiscoverScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const { query, setQuery, results, loading } = useSearch();
  const searching = query.trim().length > 0;

  const [gotd, setGotd] = useState<GameLite | null>(null);
  const [popular, setPopular] = useState<GameLite[]>([]);
  const [upcoming, setUpcoming] = useState<UpcomingGame[]>([]);
  const [reviews, setReviews] = useState<ReviewGame[]>([]);
  const [feedLoading, setFeedLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setFeedLoading(true);
    Promise.all([
      gameOfDay().catch(() => null),
      popularGames(0).then((p) => p.results).catch(() => [] as GameLite[]),
      upcomingGames().catch(() => [] as UpcomingGame[]),
      recentReviews().catch(() => [] as ReviewGame[]),
    ])
      .then(([g, p, u, r]) => {
        if (!active) return;
        setGotd(g);
        setPopular(p);
        setUpcoming(u);
        setReviews(r);
      })
      .finally(() => active && setFeedLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const feedEmpty = !gotd && popular.length === 0 && upcoming.length === 0 && reviews.length === 0;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Search box */}
      <View style={[styles.searchBox, { backgroundColor: c.surface }]}>
        <Ionicons name="search" size={18} color={c.muted} />
        <TextInput
          style={[styles.input, { color: c.text }]}
          placeholder={t('discover.searchPlaceholder')}
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

      {searching ? (
        loading && results.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator color={c.primary} size="large" />
          </View>
        ) : (
          <PosterGrid
            items={results}
            numColumns={3}
            onPress={open}
            contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }}
            ListEmptyComponent={
              <EmptyState
                icon="search-outline"
                title={t('discover.noResultsTitle')}
                subtitle={t('discover.noResultsSub', { query })}
              />
            }
          />
        )
      ) : feedLoading ? (
        <Skeleton c={c} />
      ) : feedEmpty ? (
        <EmptyState icon="flame-outline" title={t('discover.loadFailTitle')} subtitle={t('discover.loadFailSub')} />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_CLEARANCE, paddingTop: 12 }}
        >
          {/* Game of the Day hero */}
          {gotd ? (
            <Pressable
              onPress={() => open(gotd.id)}
              style={({ pressed }) => [styles.hero, { backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 }]}
            >
              {gameImage(gotd.image) ? (
                <Image source={{ uri: gameImage(gotd.image)! }} style={styles.heroCover} contentFit="cover" />
              ) : (
                <View style={[styles.heroCover, styles.heroFallback, { backgroundColor: c.background }]}>
                  <Ionicons name="game-controller" size={22} color={c.muted} />
                </View>
              )}
              <View style={styles.heroBody}>
                <Text style={[styles.heroLabel, { color: c.primary }]}>⭐ {t('discover.gameOfDay')}</Text>
                <Text style={[styles.heroName, { color: c.text }]} numberOfLines={2}>{gotd.name}</Text>
                {gotd.rating != null ? (
                  <View style={styles.heroRatingRow}>
                    <Ionicons name="star" size={13} color="#FBBF24" />
                    <Text style={[styles.heroRating, { color: c.muted }]}>{Math.round(gotd.rating)}/100</Text>
                  </View>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color={c.muted} />
            </Pressable>
          ) : null}

          {/* Popular — horizontal poster rail */}
          {popular.length ? (
            <>
              <Text style={[styles.section, { color: c.text }]}>{t('discover.popular')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railRow}>
                {popular.slice(0, 12).map((g) => (
                  <Pressable key={g.id} onPress={() => open(g.id)} style={styles.railCard}>
                    {gameImage(g.image) ? (
                      <Image source={{ uri: gameImage(g.image)! }} style={styles.railCover} contentFit="cover" transition={150} />
                    ) : (
                      <View style={[styles.railCover, styles.heroFallback, { backgroundColor: c.surface }]}>
                        <Ionicons name="game-controller" size={22} color={c.muted} />
                      </View>
                    )}
                    <Text style={[styles.railName, { color: c.text }]} numberOfLines={1}>{g.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </>
          ) : null}

          {/* Most Anticipated — countdown grid */}
          {upcoming.length ? (
            <>
              <Text style={[styles.section, { color: c.text }]}>{t('discover.anticipated')}</Text>
              {pairs(upcoming.slice(0, 6)).map((row, ri) => (
                <View key={ri} style={styles.row}>
                  {row.map((g) => (
                    <CountdownCard key={g.id} game={g} onPress={() => open(g.id)} />
                  ))}
                  {row.length === 1 ? <View style={styles.flex1} /> : null}
                </View>
              ))}
            </>
          ) : null}

          {/* Recent Reviews — bento wall */}
          {reviews.length ? (
            <>
              <Text style={[styles.section, { color: c.text }]}>{t('discover.reviews')}</Text>
              <ReviewBento items={reviews} />
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const pairs = <T,>(arr: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
};

/** Reviews bento: small pair · one large · small pairs. */
function ReviewBento({ items }: { items: ReviewGame[] }) {
  const smallW = (W - HPAD * 2 - GAP) / 2;
  const [a, b, big, ...rest] = items;
  return (
    <View style={styles.bento}>
      {a || b ? (
        <View style={styles.row}>
          {a ? <ReviewCard game={a} onPress={() => open(a.id)} style={{ width: smallW, height: SMALL_H }} /> : null}
          {b ? <ReviewCard game={b} onPress={() => open(b.id)} style={{ width: smallW, height: SMALL_H }} /> : null}
        </View>
      ) : null}
      {big ? (
        <View style={styles.rowFull}>
          <ReviewCard game={big} onPress={() => open(big.id)} big style={{ width: W - HPAD * 2, height: LARGE_H }} />
        </View>
      ) : null}
      {pairs(rest).map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((g) => (
            <ReviewCard key={g.id} game={g} onPress={() => open(g.id)} style={{ width: smallW, height: SMALL_H }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function Skeleton({ c }: { c: (typeof Colors)['dark'] }) {
  return (
    <View style={styles.skel}>
      <View style={[styles.skelHero, { backgroundColor: c.surface }]} />
      <View style={styles.row}>
        <View style={[styles.skelSmall, { backgroundColor: c.surface }]} />
        <View style={[styles.skelSmall, { backgroundColor: c.surface }]} />
      </View>
      <View style={[styles.skelLarge, { backgroundColor: c.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: HPAD,
    paddingHorizontal: 14,
    height: 46,
    borderRadius: 12,
  },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { fontSize: 18, fontWeight: '900', paddingHorizontal: HPAD, marginTop: 22, marginBottom: 12 },
  row: { flexDirection: 'row', gap: GAP, paddingHorizontal: HPAD, marginBottom: GAP },
  rowFull: { paddingHorizontal: HPAD, marginBottom: GAP },
  flex1: { flex: 1 },
  bento: {},
  // hero
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: HPAD,
    padding: 10,
    borderRadius: 16,
  },
  heroCover: { width: 56, height: 74, borderRadius: 10 },
  heroFallback: { alignItems: 'center', justifyContent: 'center' },
  railRow: { paddingHorizontal: HPAD, gap: 12 },
  railCard: { width: 116 },
  railCover: { width: 116, height: 155, borderRadius: 12, marginBottom: 6 },
  railName: { fontSize: 13, fontWeight: '600' },
  heroBody: { flex: 1, gap: 3 },
  heroLabel: { fontSize: 12, fontWeight: '800' },
  heroName: { fontSize: 16, fontWeight: '800' },
  heroRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  heroRating: { fontSize: 12, fontWeight: '700' },
  // skeleton
  skel: { paddingTop: 12 },
  skelHero: { height: 94, borderRadius: 16, marginHorizontal: HPAD, marginBottom: 20 },
  skelSmall: { flex: 1, height: SMALL_H, borderRadius: 16 },
  skelLarge: { height: LARGE_H, borderRadius: 16, marginHorizontal: HPAD, marginTop: GAP },
});
