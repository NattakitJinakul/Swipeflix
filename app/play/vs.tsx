/**
 * "VS ตัวต่อตัว" — head-to-head. Two games shown side by side; tap the one you like more.
 * King-of-the-hill: the winner stays and faces a fresh challenger. Wins are tallied per game id.
 * After ROUNDS picks, show "อันดับเกมที่คุณเลือก" ranking + "เล่นอีกครั้ง". Guest-friendly.
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
import { versusGames } from '@/src/api/endpoints';
import type { GameLite } from '@/src/types/game';

const ROUNDS = 12;

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

  const [phase, setPhase] = useState<Phase>('loading');
  const [deck, setDeck] = useState<GameLite[]>([]); // shuffled queue of challengers
  const [pair, setPair] = useState<[GameLite, GameLite] | null>(null);
  const [cursor, setCursor] = useState(0); // next challenger index in deck
  const [round, setRound] = useState(0);
  const [wins, setWins] = useState<Map<number, number>>(new Map());
  const [flash, setFlash] = useState<number | null>(null); // id of just-picked (win flash)

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

  useEffect(() => {
    let active = true;
    setPhase('loading');
    versusGames()
      .then((games) => {
        if (!active) return;
        if (games.length < 2) setPhase('error');
        else start(games);
      })
      .catch(() => active && setPhase('error'));
    return () => {
      active = false;
    };
  }, [start]);

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
      // King of the hill: winner stays, pull a fresh challenger from the deck.
      let idx = cursor;
      let challenger = deck[idx];
      if (!challenger || challenger.id === winner.id) {
        // deck exhausted or clash -> reshuffle remaining
        const rest = deck.filter((g) => g.id !== winner.id);
        challenger = rest[pickIndex(rest.length)];
        setDeck(shuffle(deck));
        idx = 0;
      }
      setPair([winner, challenger]);
      setCursor(idx + 1);
      setRound(nextRound);
      setFlash(null);
    }, 260);
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
      <Text style={[styles.topTitle, { color: c.text }]}>VS ตัวต่อตัว</Text>
      <View style={styles.backBtn} />
    </View>
  );

  if (phase === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
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
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.muted} />
          <Text style={[styles.errTitle, { color: c.text }]}>โหลดเกมไม่สำเร็จ</Text>
          <Text style={[styles.errSub, { color: c.muted }]}>ลองใหม่อีกครั้ง</Text>
        </View>
      </View>
    );
  }

  if (phase === 'result') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <Text style={[styles.resultHead, { color: c.text }]}>อันดับเกมที่คุณเลือก</Text>
          <Text style={[styles.resultSub, { color: c.muted }]}>จาก {ROUNDS} รอบ</Text>
          {ranking.map((r, i) => (
            <View key={r.game.id} style={[styles.rankRow, { backgroundColor: c.surface }]}>
              <Text style={[styles.rankNum, { color: i === 0 ? c.primary : c.muted }]}>{i + 1}</Text>
              <Image source={{ uri: r.game.image ?? undefined }} style={styles.rankCover} contentFit="cover" />
              <View style={styles.rankBody}>
                <Text numberOfLines={1} style={[styles.rankName, { color: c.text }]}>
                  {r.game.name}
                </Text>
                <Text style={[styles.rankWins, { color: c.muted }]}>
                  ชนะ {r.wins} ครั้ง
                </Text>
              </View>
              {i === 0 ? <Ionicons name="trophy" size={22} color={c.primary} /> : null}
            </View>
          ))}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              start(deck);
            }}
            style={[styles.replayBtn, { backgroundColor: c.primary }]}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.replayText}>เล่นอีกครั้ง</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  // phase === 'play'
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {Header}
      <View style={styles.progressWrap}>
        <Text style={[styles.progressText, { color: c.muted }]}>
          รอบ {Math.min(round + 1, ROUNDS)} / {ROUNDS}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: c.surface }]}>
          <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${(round / ROUNDS) * 100}%` }]} />
        </View>
      </View>
      <Text style={[styles.prompt, { color: c.text }]}>ชอบอันไหนมากกว่า?</Text>

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
                    pressed && { transform: [{ scale: 0.97 }] },
                  ]}
                >
                  <Image source={{ uri: g.image ?? undefined }} style={styles.vsCover} contentFit="cover" transition={200} />
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.vsShade} pointerEvents="none" />
                  <View style={styles.vsMeta}>
                    <Text numberOfLines={2} style={styles.vsName}>
                      {g.name}
                    </Text>
                    {g.rating != null ? (
                      <View style={styles.vsRating}>
                        <Ionicons name="star" size={13} color="#FBBF24" />
                        <Text style={styles.vsRatingText}>{Math.round(g.rating)}</Text>
                      </View>
                    ) : null}
                  </View>
                  {isFlash ? (
                    <View style={styles.winBadge}>
                      <Ionicons name="checkmark" size={26} color="#fff" />
                    </View>
                  ) : null}
                </Pressable>
              );
            })
          : null}
        <View style={[styles.vsBadge, { backgroundColor: c.background, borderColor: c.primary }]}>
          <Text style={[styles.vsBadgeText, { color: c.primary }]}>VS</Text>
        </View>
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
  progressWrap: { paddingHorizontal: 16, paddingTop: 4, gap: 6 },
  progressText: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  prompt: { textAlign: 'center', fontSize: 20, fontWeight: '800', marginTop: 16, marginBottom: 4 },
  arena: { flex: 1, flexDirection: 'row', gap: 12, padding: 16, alignItems: 'center' },
  vsCard: {
    flex: 1,
    height: '92%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2.5,
  },
  vsCover: { width: '100%', height: '100%' },
  vsShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  vsMeta: { position: 'absolute', left: 12, right: 12, bottom: 14, gap: 6 },
  vsName: { color: '#fff', fontSize: 17, fontWeight: '800' },
  vsRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  vsRatingText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  winBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
  },
  vsBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -26,
    marginTop: -26,
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vsBadgeText: { fontSize: 16, fontWeight: '900' },
  // result
  resultHead: { fontSize: 26, fontWeight: '800' },
  resultSub: { fontSize: 14, marginTop: 2, marginBottom: 18 },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    marginBottom: 10,
  },
  rankNum: { width: 24, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  rankCover: { width: 46, height: 62, borderRadius: 8, backgroundColor: '#000' },
  rankBody: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: '700' },
  rankWins: { fontSize: 12, marginTop: 3 },
  replayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 16,
  },
  replayText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
