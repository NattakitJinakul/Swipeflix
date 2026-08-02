/**
 * Swipe screen — core Tinder-style game deck. Wires CardStack to useDeck + useLibrary:
 * right = like (+ confetti + haptic), left = dislike, up/button = played. Undo, filter bar
 * (category chips + platform toggle), deck-source toggle, surprise-me, empty/error states.
 * Guest-first: guests browse/swipe freely; like/played prompt login (no save). A free-tier
 * swipe quota gate applies only to signed-in users.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton, ACTION_COLORS } from '@/components/ActionButton';
import { CardStack } from '@/components/CardStack';
import { EmptyState } from '@/components/EmptyState';
import { gameImage } from '@/components/game-image';
import { GenreChip } from '@/components/GenreChip';
import { SignInPrompt } from '@/components/SignInPrompt';
import { SwipeTutorial, TUTORIAL_KEY } from '@/components/SwipeTutorial';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFirstRun } from '@/src/hooks/useFirstRun';
import { useT } from '@/src/i18n';
import { popularGames } from '@/src/api/endpoints';
import { useDeck, type DeckSource } from '@/src/hooks/useDeck';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';
import { CATEGORIES, categoryLabel } from '@/src/utils/genres';

// A like on a game rated this high (IGDB 0-100) triggers the full-screen MATCH celebration.
const MATCH_RATING = 85;

const { width: SCREEN_W } = Dimensions.get('window');

const SOURCES: { key: DeckSource; labelKey: string }[] = [
  { key: 'popular', labelKey: 'swipe.sourcePopular' },
  { key: 'new', labelKey: 'swipe.sourceNew' },
  { key: 'top_rated', labelKey: 'swipe.sourceTopRated' },
  { key: 'for_you', labelKey: 'swipe.sourceForYou' },
];

// Genre chip set for the filter bar (onboarding/preferences expose all CATEGORIES).
const FILTER_CATEGORIES = CATEGORIES;

export default function SwipeScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const deck = useDeck();
  const { isGuest } = useAuth();
  const { like, dislike, markPlayed, undo, canUndo, lastActionOrigin } = useLibrary();

  const [showFilters, setShowFilters] = useState(false);
  const [burst, setBurst] = useState(0);
  const [signInPrompt, setSignInPrompt] = useState(false);
  const tutorial = useFirstRun(TUTORIAL_KEY);

  // Daily featured game — deterministic pick from the popular list, stable for the calendar day.
  const [daily, setDaily] = useState<GameLite | null>(null);
  useEffect(() => {
    let active = true;
    popularGames(1)
      .then((paged) => {
        const list = paged.results;
        if (!active || !list.length) return;
        setDaily(list[new Date().getDate() % list.length]);
      })
      .catch(() => {}); // hide banner on error
    return () => {
      active = false;
    };
  }, []);

  // MATCH celebration overlay (high-rated like). Driven by state + a Reanimated fade/scale.
  const [match, setMatch] = useState<GameLite | null>(null);
  const matchAnim = useSharedValue(0);
  const matchStyle = useAnimatedStyle(() => ({
    opacity: matchAnim.value,
    transform: [{ scale: interpolate(matchAnim.value, [0, 1], [0.85, 1]) }],
  }));
  const celebrate = useCallback(
    (game: GameLite) => {
      setMatch(game);
      setBurst((b) => b + 1);
      matchAnim.value = withTiming(1, { duration: 220 });
      setTimeout(() => {
        matchAnim.value = withTiming(0, { duration: 240 });
      }, 1000);
      setTimeout(() => setMatch(null), 1300);
    },
    [matchAnim],
  );

  // Guest save prompt — like/played require login. Returns true when the action must be blocked.
  const promptLogin = useCallback((): boolean => {
    if (!isGuest) return false;
    setSignInPrompt(true);
    return true;
  }, [isGuest]);

  const handleLike = useCallback(
    (game: GameLite) => {
      if (promptLogin()) {
        deck.advance();
        return;
      }
      like(game, 'deck');
      // High-rated like -> full-screen MATCH celebration; otherwise the small confetti burst.
      if (game.rating != null && game.rating >= MATCH_RATING) celebrate(game);
      else setBurst((b) => b + 1);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      deck.advance();
    },
    [promptLogin, like, celebrate, deck],
  );
  const handleDislike = useCallback(
    (id: number) => {
      dislike(id, 'deck');
      deck.advance();
    },
    [dislike, deck],
  );
  const handlePlayed = useCallback(
    (game: GameLite) => {
      if (promptLogin()) {
        deck.advance();
        return;
      }
      markPlayed(game, 'deck');
      deck.advance();
    },
    [promptLogin, markPlayed, deck],
  );

  const canUndoDeck = canUndo && lastActionOrigin === 'deck';

  const handleUndo = useCallback(() => {
    if (!canUndoDeck) return;
    undo();
    deck.rewind();
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

      {/* Daily featured game banner (tap -> detail) */}
      {daily ? (
        <Pressable
          onPress={() => router.push(`/game/${daily.id}`)}
          style={({ pressed }) => [
            styles.daily,
            { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          {gameImage(daily.image) ? (
            <Image source={{ uri: gameImage(daily.image)! }} style={styles.dailyThumb} contentFit="cover" />
          ) : (
            <View style={[styles.dailyThumb, styles.dailyThumbFallback, { backgroundColor: c.background }]}>
              <Ionicons name="game-controller" size={18} color={c.muted} />
            </View>
          )}
          <View style={styles.dailyInfo}>
            <Text style={[styles.dailyLabel, { color: c.primary }]}>{t('swipe.dailyLabel')}</Text>
            <Text style={[styles.dailyName, { color: c.text }]} numberOfLines={1}>
              {daily.name}
            </Text>
          </View>
          {daily.rating != null ? (
            <View style={styles.dailyRating}>
              <Ionicons name="star" size={12} color="#F5C518" />
              <Text style={[styles.dailyRatingText, { color: c.text }]}>{Math.round(daily.rating)}</Text>
            </View>
          ) : null}
          <Ionicons name="chevron-forward" size={18} color={c.muted} />
        </Pressable>
      ) : null}

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
              {t(s.labelKey)}
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
        {deck.error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('swipe.errorTitle')}
            subtitle={t('swipe.errorSub')}
            actionLabel={t('common.retry')}
            onAction={deck.retry}
          />
        ) : deckEmpty ? (
          <EmptyState
            icon="albums-outline"
            title={t('swipe.emptyTitle')}
            subtitle={t('swipe.emptySub')}
            actionLabel={t('swipe.reload')}
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

      {/* Action buttons (below card) — glowing buttons floating on the background */}
      {!deck.error && !deckEmpty ? (
        <View style={styles.actions}>
          <View style={styles.actionCol}>
            <ActionButton
              size={62}
              icon="thumbs-down"
              color={ACTION_COLORS.dislike}
              onPress={() => deck.current && handleDislike(deck.current.id)}
            />
            <Text style={[styles.actionLabel, { color: c.muted }]}>{t('swipe.dislike')}</Text>
          </View>
          <View style={styles.actionCol}>
            <ActionButton
              size={54}
              icon="checkmark-done"
              color={ACTION_COLORS.watched}
              onPress={() => deck.current && handlePlayed(deck.current)}
            />
            <Text style={[styles.actionLabel, { color: c.muted }]}>{t('swipe.played')}</Text>
          </View>
          <View style={styles.actionCol}>
            <ActionButton
              size={70}
              icon="heart"
              color={ACTION_COLORS.like}
              onPress={() => deck.current && handleLike(deck.current)}
            />
            <Text style={[styles.actionLabel, { color: c.muted }]}>{t('swipe.like')}</Text>
          </View>
          <View style={styles.actionCol}>
            <ActionButton
              size={54}
              icon="arrow-undo"
              color={ACTION_COLORS.undo}
              disabled={!canUndoDeck}
              onPress={handleUndo}
            />
            <Text style={[styles.actionLabel, { color: c.muted }]}>{t('swipe.undo')}</Text>
          </View>
        </View>
      ) : null}

      {/* MATCH! celebration overlay (high-rated like) */}
      {match ? (
        <Animated.View style={[styles.matchOverlay, matchStyle]} pointerEvents="none">
          <Text style={styles.matchTitle}>MATCH!</Text>
          {gameImage(match.image) ? (
            <Image source={{ uri: gameImage(match.image)! }} style={styles.matchCover} contentFit="cover" />
          ) : (
            <View style={[styles.matchCover, styles.matchCoverFallback]}>
              <Ionicons name="game-controller" size={56} color="#fff" />
            </View>
          )}
          <Text style={styles.matchName} numberOfLines={2}>
            {match.name}
          </Text>
        </Animated.View>
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

      {/* First-run coach-mark tutorial (guest-friendly). Shown only after the flag loads as false. */}
      {tutorial.seen === false ? <SwipeTutorial onDone={tutorial.markSeen} /> : null}

      {/* Guest "sign in to save" popup (replaces the native Alert). */}
      <SignInPrompt
        visible={signInPrompt}
        onClose={() => setSignInPrompt(false)}
        onSignIn={() => {
          setSignInPrompt(false);
          router.push('/(auth)/login');
        }}
      />
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
  actionCol: { alignItems: 'center', gap: 8 },
  actionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
  },
  // เกมแห่งวัน banner
  daily: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 8,
    borderRadius: 14,
  },
  dailyThumb: { width: 44, height: 44, borderRadius: 8 },
  dailyThumbFallback: { alignItems: 'center', justifyContent: 'center' },
  dailyInfo: { flex: 1, gap: 1 },
  dailyLabel: { fontSize: 11, fontWeight: '800' },
  dailyName: { fontSize: 14, fontWeight: '700' },
  dailyRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dailyRatingText: { fontSize: 13, fontWeight: '800' },
  // MATCH! overlay
  matchOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  matchTitle: {
    color: '#fff',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 10,
  },
  matchCover: {
    width: 180,
    height: 240,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#fff',
  },
  matchCoverFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#222' },
  matchName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginHorizontal: 32,
  },
});
