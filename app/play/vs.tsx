/**
 * "VS" — head-to-head. Two large full-width game cards STACKED vertically, with a bold circular
 * VS badge overlapping between them, so each cover reads clearly. Tap a card body = vote for it;
 * the small info button on a card opens its detail (no vote). Source toggle: My Likes | Random.
 * King-of-the-hill: the winner stays and meets a fresh challenger; ranking + play again at the end.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';
import { versusGames } from '@/src/api/endpoints';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';

const ROUNDS = 12;
const MEDALS = ['#FBBF24', '#CBD5E1', '#D08B5B']; // gold / silver / bronze

type Source = 'likes' | 'random';

const pickIndex = (n: number) => Math.floor(Math.random() * n);
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

type Phase = 'loading' | 'error' | 'play' | 'result';

export default function VersusGame() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();
  const { liked } = useLibrary();

  const [source, setSource] = useState<Source>('random');
  const [fellBack, setFellBack] = useState(false);
  const [phase, setPhase] = useState<Phase>('loading');
  const [deck, setDeck] = useState<GameLite[]>([]);
  const [pair, setPair] = useState<[GameLite, GameLite] | null>(null);
  const [cursor, setCursor] = useState(0);
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState<Map<number, number>>(new Map());
  const [flash, setFlash] = useState<number | null>(null);

  const start = useCallback((games: GameLite[]) => {
    const d = shuffle(games);
    if (d.length < 2) {
      setPhase('error');
      return;
    }
    setDeck(d);
    setWins(new Map());
    setRound(0);
    setFlash(null);
    setPair([d[0], d[1]]);
    setCursor(2);
    setPhase('play');
  }, []);

  // Load a pool for the chosen source. My Likes uses liked covers; falls back to Random when <2.
  useEffect(() => {
    let active = true;
    setPhase('loading');
    setFellBack(false);
    (async () => {
      try {
        if (source === 'likes') {
          const mine = liked.filter((g) => !!g.image);
          if (mine.length >= 2) {
            if (active) start(mine);
            return;
          }
          if (active) setFellBack(true);
        }
        const games = await versusGames();
        if (active) start(games);
      } catch {
        if (active) setPhase('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [source, liked, start]);

  const onPick = (winnerSide: 0 | 1) => {
    if (!pair || flash !== null) return;
    const winner = pair[winnerSide];
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setWins((m) => {
      const next = new Map(m);
      next.set(winner.id, (next.get(winner.id) ?? 0) + 1);
      return next;
    });
    setFlash(winner.id);

    const nextRound = round + 1;
    setTimeout(() => {
      if (nextRound >= ROUNDS) {
        setRound(nextRound);
        setPhase('result');
        return;
      }
      let idx = cursor;
      let challenger = deck[idx];
      if (!challenger || challenger.id === winner.id) {
        const rest = deck.filter((g) => g.id !== winner.id);
        challenger = rest[pickIndex(rest.length)];
        setDeck(shuffle(deck));
        idx = 0;
      }
      setPair([winner, challenger]);
      setCursor(idx + 1);
      setRound(nextRound);
      setFlash(null);
    }, 300);
  };

  const ranking = [...wins.entries()]
    .map(([id, w]) => ({ game: deck.find((g) => g.id === id)!, wins: w }))
    .filter((r) => r.game)
    .sort((a, b) => b.wins - a.wins);

  const Header = (
    <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
      <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="chevron-back" size={26} color={c.text} />
      </Pressable>
      <Text style={[styles.topTitle, { color: c.text }]}>{t('play.vsTitle')}</Text>
      <View style={styles.backBtn} />
    </View>
  );

  const SourceToggle = (
    <View style={styles.sourceWrap}>
      <View style={[styles.segment, { backgroundColor: c.surface }]}>
        {(['likes', 'random'] as Source[]).map((s) => (
          <Pressable
            key={s}
            onPress={() => setSource(s)}
            style={[styles.segItem, source === s && { backgroundColor: c.primary }]}
          >
            <Text style={[styles.segText, { color: source === s ? '#fff' : c.muted }]}>
              {s === 'likes' ? t('play.sourceLikes') : t('play.sourceRandom')}
            </Text>
          </Pressable>
        ))}
      </View>
      {fellBack ? <Text style={[styles.fellBack, { color: c.muted }]}>{t('play.likesTooFew')}</Text> : null}
    </View>
  );

  if (phase === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
        {SourceToggle}
        <View style={styles.center}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </View>
    );
  }

  if (phase === 'error') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
        {SourceToggle}
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.muted} />
          <Text style={[styles.errTitle, { color: c.text }]}>{t('play.loadFailTitle')}</Text>
          <Text style={[styles.errSub, { color: c.muted }]}>{t('play.loadFailSub')}</Text>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.resultHead, { color: c.text }]}>{t('play.vsResultHead')}</Text>
          <Text style={[styles.resultSub, { color: c.muted }]}>{t('play.vsResultSub', { n: ROUNDS })}</Text>
          {ranking.map((r, i) => (
            <Pressable
              key={r.game.id}
              onPress={() => router.push(`/game/${r.game.id}`)}
              style={({ pressed }) => [styles.rankRow, { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 }]}
            >
              {i < 3 ? (
                <View style={[styles.medal, { backgroundColor: MEDALS[i] }]}>
                  <Ionicons name="trophy" size={16} color="#1A1A00" />
                </View>
              ) : (
                <Text style={[styles.rankNum, { color: c.muted }]}>{i + 1}</Text>
              )}
              <Image source={{ uri: r.game.image ?? undefined }} style={styles.rankCover} contentFit="cover" />
              <View style={styles.rankBody}>
                <Text numberOfLines={1} style={[styles.rankName, { color: c.text }]}>
                  {r.game.name}
                </Text>
                <Text style={[styles.rankWins, { color: c.muted }]}>{t('play.vsWins', { n: r.wins })}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              start(deck);
            }}
            style={[styles.replayBtn, { backgroundColor: c.primary }]}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.replayText}>{t('play.vsReplay')}</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // phase === 'play'
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {Header}
      {SourceToggle}
      <View style={styles.progressWrap}>
        <Text style={[styles.progressText, { color: c.muted }]}>
          {t('play.vsRound', { n: Math.min(round + 1, ROUNDS), total: ROUNDS })}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: c.surface }]}>
          <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${(round / ROUNDS) * 100}%` }]} />
        </View>
      </View>
      <Text style={[styles.prompt, { color: c.text }]}>{t('play.vsPrompt')}</Text>

      <View style={styles.arena}>
        {pair
          ? ([0, 1] as const).map((side) => {
              const g = pair[side];
              const isFlash = flash === g.id;
              return (
                <Pressable
                  key={`${side}-${g.id}`}
                  disabled={flash !== null}
                  onPress={() => onPick(side)}
                  style={({ pressed }) => [
                    styles.vsCard,
                    { backgroundColor: c.surface, borderColor: isFlash ? c.like : 'transparent' },
                    pressed && { transform: [{ scale: 0.98 }] },
                  ]}
                >
                  <Image source={{ uri: g.image ?? undefined }} style={styles.vsCover} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.92)']} style={styles.vsShade} pointerEvents="none" />

                  {/* Details (does NOT vote) */}
                  <Pressable
                    hitSlop={8}
                    onPress={() => router.push(`/game/${g.id}`)}
                    style={({ pressed }) => [styles.detailsBtn, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Ionicons name="information-circle" size={16} color="#fff" />
                    <Text style={styles.detailsText}>{t('play.details')}</Text>
                  </Pressable>

                  <View style={styles.vsMeta}>
                    <Text numberOfLines={2} style={styles.vsName}>
                      {g.name}
                    </Text>
                    <View style={styles.vsMetaRow}>
                      {g.rating != null ? (
                        <View style={styles.vsRating}>
                          <Ionicons name="star" size={13} color="#FBBF24" />
                          <Text style={styles.vsRatingText}>{Math.round(g.rating)}</Text>
                        </View>
                      ) : null}
                      {g.genre ? <Text style={styles.vsGenre}>{g.genre}</Text> : null}
                    </View>
                  </View>

                  {isFlash ? (
                    <View style={styles.winBadge}>
                      <Ionicons name="checkmark" size={30} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          : null}

        {/* Center VS badge overlapping the two stacked cards */}
        <LinearGradient
          colors={[c.primary, '#FF5A67']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.vsBadge, { borderColor: c.background }]}
        >
          <Text style={styles.vsBadgeText}>VS</Text>
        </LinearGradient>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  errTitle: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  errSub: { fontSize: 14 },
  // source toggle
  sourceWrap: { paddingHorizontal: 16, gap: 6 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segText: { fontSize: 13, fontWeight: '700' },
  fellBack: { fontSize: 12, textAlign: 'center' },
  progressWrap: { paddingHorizontal: 16, paddingTop: 10, gap: 6 },
  progressText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  prompt: { textAlign: 'center', fontSize: 20, fontWeight: '900', marginTop: 12, marginBottom: 2 },
  arena: { flex: 1, gap: 14, padding: 16, justifyContent: 'center' },
  vsCard: {
    flex: 1,
    width: '100%',
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  vsCover: { width: '100%', height: '100%' },
  vsShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  detailsBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  detailsText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  vsMeta: { position: 'absolute', left: 14, right: 14, bottom: 14, gap: 6 },
  vsName: { color: '#fff', fontSize: 19, fontWeight: '900' },
  vsMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  vsRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vsRatingText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  vsGenre: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  winBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
  },
  vsBadge: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    marginTop: -30,
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
  },
  vsBadgeText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  // result
  resultHead: { fontSize: 26, fontWeight: '900' },
  resultSub: { fontSize: 14, marginTop: 2, marginBottom: 18 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    marginBottom: 10,
  },
  medal: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  rankNum: { width: 30, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  rankCover: { width: 46, height: 62, borderRadius: 8, backgroundColor: '#000' },
  rankBody: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: '700' },
  rankWins: { fontSize: 12, marginTop: 3 },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 54,
    borderRadius: 16,
    marginTop: 16,
  },
  replayText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
