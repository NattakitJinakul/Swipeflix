/**
 * Swipe screen — core Tinder-style deck. Wires CardStack to useDeck + useLibrary:
 * right = like (+ confetti + haptic), left = dislike, up/button = watched. Undo, filter bar
 * (genre chips + rating), deck-source toggle, surprise-me, empty state, and a free-tier
 * swipe gate (canSwipe). See docs/02-screens.md + docs/11-enhancements.md.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardStack } from '@/components/CardStack';
import { EmptyState } from '@/components/EmptyState';
import { GenreChip } from '@/components/GenreChip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeck, type DeckSource } from '@/src/hooks/useDeck';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { MovieLite } from '@/src/types/movie';
import { GENRE_MAP, genreNames } from '@/src/utils/genres';
import { getPlan } from '@/src/utils/plans';

const { width: SCREEN_W } = Dimensions.get('window');

const SOURCES: { key: DeckSource; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'top_rated', label: 'Top rated' },
  { key: 'now_playing', label: 'Now playing' },
  { key: 'for_you', label: 'ตามที่ชอบ' },
];

const RATING_STEPS = [6, 7, 8];
const GENRE_ENTRIES = Object.entries(GENRE_MAP).map(([id, name]) => ({ id: Number(id), name }));

export default function SwipeScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const deck = useDeck();
  const { plan } = useAuth();
  const { like, dislike, markWatched, undo, canUndo, lastActionOrigin } = useLibrary();

  // Swipe gate: limit from plan (null = unlimited for plus/pro). Count in memory (resets on restart).
  const swipeLimit = getPlan(plan).swipeLimit;
  const [swipeCount, setSwipeCount] = useState(0);
  const allowed = swipeLimit == null || swipeCount < swipeLimit;

  const [showFilters, setShowFilters] = useState(false);
  const [burst, setBurst] = useState(0);

  const bump = useCallback(() => setSwipeCount((n) => n + 1), []);

  const handleLike = useCallback(
    (movie: MovieLite) => {
      like(movie, 'deck');
      bump();
      setBurst((b) => b + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      deck.advance();
    },
    [like, bump, deck],
  );
  const handleDislike = useCallback(
    (id: number) => {
      dislike(id, 'deck');
      bump();
      deck.advance();
    },
    [dislike, bump, deck],
  );
  const handleWatched = useCallback(
    (movie: MovieLite) => {
      markWatched(movie, 'deck');
      bump();
      deck.advance();
    },
    [markWatched, bump, deck],
  );

  // L3: Undo only for deck-origin actions — a detail-screen like won't be reversed here.
  const canUndoDeck = canUndo && lastActionOrigin === 'deck';

  const handleUndo = useCallback(() => {
    if (!canUndoDeck) return;
    undo();
    deck.rewind();
    setSwipeCount((n) => Math.max(0, n - 1));
  }, [canUndoDeck, undo, deck]);

  const surpriseMe = useCallback(() => {
    const pool = deck.deck.slice(deck.index);
    if (!pool.length) return;
    const pick = pool[Math.floor(Math.random() * Math.min(pool.length, 20))];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(`/movie/${pick.id}`);
  }, [deck]);

  const openDetail = useCallback((id: number) => router.push(`/movie/${id}`), []);

  const toggleGenre = useCallback(
    (id: number) => {
      const has = deck.filters.genres.includes(id);
      deck.setFilters({
        ...deck.filters,
        genres: has ? deck.filters.genres.filter((g) => g !== id) : [...deck.filters.genres, id],
      });
    },
    [deck],
  );

  const setRating = useCallback(
    (r: number) => {
      deck.setFilters({ ...deck.filters, minRating: deck.filters.minRating === r ? undefined : r });
    },
    [deck],
  );

  const deckEmpty = !deck.loading && deck.deck.length - deck.index <= 0;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: c.primary }]}>Swipeflix</Text>
        <View style={styles.topActions}>
          <IconButton icon="shuffle" color={c.text} onPress={surpriseMe} />
          <IconButton
            icon="options-outline"
            color={showFilters ? c.primary : c.text}
            onPress={() => setShowFilters((s) => !s)}
          />
        </View>
      </View>

      {/* Source toggle */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sourceRow}
      >
        {SOURCES.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => deck.setSource(s.key)}
            style={[
              styles.sourceChip,
              { backgroundColor: deck.source === s.key ? c.primary : c.surface },
            ]}
          >
            <Text style={[styles.sourceText, { color: deck.source === s.key ? '#fff' : c.muted }]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Filter bar (collapsible) */}
      {showFilters ? (
        <View style={styles.filters}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {GENRE_ENTRIES.map((g) => (
              <GenreChip
                key={g.id}
                label={g.name}
                selected={deck.filters.genres.includes(g.id)}
                onToggle={() => toggleGenre(g.id)}
              />
            ))}
          </ScrollView>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {RATING_STEPS.map((r) => (
              <Pressable
                key={r}
                onPress={() => setRating(r)}
                style={[
                  styles.miniChip,
                  { backgroundColor: deck.filters.minRating === r ? c.primary : c.surface },
                ]}
              >
                <Text
                  style={{
                    color: deck.filters.minRating === r ? '#fff' : c.muted,
                    fontWeight: '700',
                  }}
                >
                  ⭐ {r}+
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {/* Deck area */}
      <View style={styles.deckArea}>
        {!allowed ? (
          <EmptyState
            icon="lock-closed-outline"
            title="ปัดครบโควตาวันนี้แล้ว"
            subtitle={`ปัดได้ ${swipeLimit == null ? 'ไม่จำกัด' : `${swipeLimit} เรื่อง/วัน`} — อัปเกรดเพื่อปัดไม่จำกัด`}
            actionLabel="ดูแผน Plus"
            onAction={() => router.push('/(auth)/pricing')}
          />
        ) : deck.error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="โหลดไม่สำเร็จ"
            subtitle="ตรวจการเชื่อมต่ออินเทอร์เน็ตหรือ TMDB token แล้วลองใหม่"
            actionLabel="ลองใหม่"
            onAction={deck.retry}
          />
        ) : deckEmpty ? (
          <EmptyState
            icon="albums-outline"
            title="ดูครบแล้ว!"
            subtitle="ลองเปลี่ยน filter หรือแหล่ง deck เพื่อเจอหนังใหม่ ๆ"
            actionLabel="โหลดเพิ่ม"
            onAction={deck.reload}
          />
        ) : (
          <CardStack
            key={`${deck.source}-${deck.index}`}
            movies={deck.deck.slice(deck.index)}
            genresOf={(m) => genreNames(m.genreIds)}
            onSwipeLeft={handleDislike}
            onSwipeRight={handleLike}
            onSwipeUp={handleWatched}
            onTapCard={openDetail}
          />
        )}
      </View>

      {/* Action buttons */}
      {allowed && !deck.error && !deckEmpty ? (
        <View style={[styles.actions, { paddingBottom: insets.bottom + 8 }]}>
          <RoundButton
            icon="close"
            color={c.dislike}
            bg={c.surface}
            onPress={() => deck.current && handleDislike(deck.current.id)}
          />
          <RoundButton
            icon="eye"
            color={c.watched}
            bg={c.surface}
            small
            onPress={() => deck.current && handleWatched(deck.current)}
          />
          <RoundButton
            icon="heart"
            color={c.like}
            bg={c.surface}
            onPress={() => deck.current && handleLike(deck.current)}
          />
          <RoundButton
            icon="arrow-undo"
            color={canUndoDeck ? c.text : c.muted}
            bg={c.surface}
            small
            onPress={handleUndo}
          />
        </View>
      ) : null}

      {burst > 0 ? (
        <ConfettiCannon
          key={burst}
          count={90}
          origin={{ x: SCREEN_W / 2, y: -20 }}
          autoStart
          fadeOut
          explosionSpeed={380}
          fallSpeed={2800}
        />
      ) : null}
    </View>
  );
}

function IconButton({
  icon,
  color,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable hitSlop={10} onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
      <Ionicons name={icon} size={24} color={color} />
    </Pressable>
  );
}

function RoundButton({
  icon,
  color,
  bg,
  onPress,
  small,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
  onPress: () => void;
  small?: boolean;
}) {
  const size = small ? 52 : 64;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.roundBtn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={small ? 24 : 30} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  brand: { fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
  topActions: { flexDirection: 'row', gap: 18 },
  sourceRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  sourceChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  sourceText: { fontSize: 13, fontWeight: '700' },
  filters: { gap: 8, paddingBottom: 6 },
  filterRow: { paddingHorizontal: 16, gap: 8 },
  miniChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  deckArea: { flex: 1, marginHorizontal: 4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    paddingTop: 12,
  },
  roundBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
});
