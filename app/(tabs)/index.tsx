/**
 * Swipe screen — core Tinder-style game deck. Wires CardStack to useDeck + useLibrary:
 * right = like (+ confetti + haptic), left = dislike, up/button = played. Undo, filter bar
 * (category chips + platform toggle), deck-source toggle, surprise-me, empty/error states.
 * Guest-first: guests browse/swipe freely; like/played prompt login (no save). A free-tier
 * swipe quota gate applies only to signed-in users.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton, ACTION_COLORS } from '@/components/ActionButton';
import { CardStack } from '@/components/CardStack';
import { EmptyState } from '@/components/EmptyState';
import { GenreChip } from '@/components/GenreChip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useDeck, type DeckSource } from '@/src/hooks/useDeck';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';
import { CATEGORIES, categoryLabel } from '@/src/utils/genres';

const { width: SCREEN_W } = Dimensions.get('window');

const SOURCES: { key: DeckSource; label: string }[] = [
  { key: 'popular', label: 'ยอดนิยม' },
  { key: 'new', label: 'ใหม่' },
  { key: 'top_rated', label: 'คะแนนสูง' },
  { key: 'for_you', label: 'ตามที่ชอบ' },
];

// Genre chip set for the filter bar (onboarding/preferences expose all CATEGORIES).
const FILTER_CATEGORIES = CATEGORIES;

export default function SwipeScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const deck = useDeck();
  const { plan, isGuest } = useAuth();
  const { like, dislike, markPlayed, undo, canUndo, lastActionOrigin } = useLibrary();

  // Swipe quota applies ONLY to signed-in users; guests browse freely (unlimited).
  const swipeLimit = getSwipeLimit(plan);
  const [swipeCount, setSwipeCount] = useState(0);
  const allowed = isGuest || swipeLimit == null || swipeCount < swipeLimit;

  const [showFilters, setShowFilters] = useState(false);
  const [burst, setBurst] = useState(0);

  const bump = useCallback(() => setSwipeCount((n) => n + 1), []);

  // Guest save prompt — like/played require login. Returns true when the action must be blocked.
  const promptLogin = useCallback((): boolean => {
    if (!isGuest) return false;
    Alert.alert('เข้าสู่ระบบ', 'บันทึกเกมที่ชอบต้องเข้าสู่ระบบก่อน', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'เข้าสู่ระบบ', onPress: () => router.push('/(auth)/login') },
    ]);
    return true;
  }, [isGuest]);

  const handleLike = useCallback(
    (game: GameLite) => {
      if (promptLogin()) {
        deck.advance();
        return;
      }
      like(game, 'deck');
      bump();
      setBurst((b) => b + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      deck.advance();
    },
    [promptLogin, like, bump, deck],
  );
  const handleDislike = useCallback(
    (id: number) => {
      dislike(id, 'deck');
      bump();
      deck.advance();
    },
    [dislike, bump, deck],
  );
  const handlePlayed = useCallback(
    (game: GameLite) => {
      if (promptLogin()) {
        deck.advance();
        return;
      }
      markPlayed(game, 'deck');
      bump();
      deck.advance();
    },
    [promptLogin, markPlayed, bump, deck],
  );

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
    router.push(`/game/${pick.id}`);
  }, [deck]);

  const openDetail = useCallback((id: number) => router.push(`/game/${id}`), []);

  const toggleGenre = useCallback(
    (name: string) => {
      const has = deck.filters.genres.includes(name);
      deck.setFilters({
        genres: has ? deck.filters.genres.filter((g) => g !== name) : [...deck.filters.genres, name],
      });
    },
    [deck],
  );

  const deckEmpty = !deck.loading && deck.deck.length - deck.index <= 0;

  return (
    <View style={[styles.root, { backgroundColor: c.background, paddingTop: insets.top + 8 }]}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={[styles.brand, { color: c.primary }]}>Swipeplay</Text>
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
        style={styles.hScroll}
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
            style={styles.hScroll}
            contentContainerStyle={styles.filterRow}
          >
            {FILTER_CATEGORIES.map((name) => (
              <GenreChip
                key={name}
                label={categoryLabel(name)}
                selected={deck.filters.genres.includes(name)}
                onToggle={() => toggleGenre(name)}
              />
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
            subtitle={`ปัดได้ ${swipeLimit == null ? 'ไม่จำกัด' : `${swipeLimit} เกม/วัน`} — อัปเกรดเพื่อปัดไม่จำกัด`}
            actionLabel="ดูแผน Plus"
            onAction={() => router.push('/(auth)/pricing')}
          />
        ) : deck.error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="โหลดไม่สำเร็จ"
            subtitle="ตรวจการเชื่อมต่ออินเทอร์เน็ตแล้วลองใหม่"
            actionLabel="ลองใหม่"
            onAction={deck.retry}
          />
        ) : deckEmpty ? (
          <EmptyState
            icon="albums-outline"
            title="ดูครบแล้ว!"
            subtitle="ลองเปลี่ยน filter หรือแหล่ง deck เพื่อเจอเกมใหม่ ๆ"
            actionLabel="โหลดใหม่"
            onAction={deck.reload}
          />
        ) : (
          <CardStack
            key={`${deck.source}-${deck.index}`}
            games={deck.deck.slice(deck.index)}
            genresOf={(g) => (g.genre ? [g.genre] : [])}
            onSwipeLeft={handleDislike}
            onSwipeRight={handleLike}
            onSwipeUp={handlePlayed}
            onTapCard={openDetail}
          />
        )}
      </View>

      {/* Action buttons (below card) */}
      {allowed && !deck.error && !deckEmpty ? (
        <View style={styles.actions}>
          <ActionButton
            icon="thumbs-down"
            color={ACTION_COLORS.dislike}
            onPress={() => deck.current && handleDislike(deck.current.id)}
          />
          <ActionButton
            icon="game-controller"
            color={ACTION_COLORS.watched}
            onPress={() => deck.current && handlePlayed(deck.current)}
          />
          <ActionButton
            icon="heart"
            color={ACTION_COLORS.like}
            onPress={() => deck.current && handleLike(deck.current)}
          />
          <ActionButton
            icon="arrow-undo"
            color={ACTION_COLORS.undo}
            disabled={!canUndoDeck}
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

// Free tier = 40 swipes/session; paid tiers unlimited (null).
function getSwipeLimit(plan: string): number | null {
  return plan === 'free' ? 40 : null;
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
  hScroll: { flexGrow: 0, flexShrink: 0 },
  sourceRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, alignItems: 'center' },
  sourceChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, alignSelf: 'center' },
  sourceText: { fontSize: 13, fontWeight: '700' },
  filters: { gap: 8, paddingBottom: 6 },
  filterRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  miniChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, alignSelf: 'center' },
  deckArea: { flex: 1, marginHorizontal: 4 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
});
