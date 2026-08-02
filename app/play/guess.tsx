/**
 * "Guess the game" — guess the game from one of its screenshots.
 * 10 rounds: each shows a random screenshot + 4 name choices (1 correct, 3 distractors).
 * Tap -> reveal correct(green)/wrong(red) + haptic, bump score/streak. After the last round a
 * result card shows score + best streak + Play again. Guest-friendly. Data logic unchanged.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';
import { guessGames, screenshotsForGames, type GuessGame } from '@/src/api/endpoints';
import { useLibrary } from '@/src/store/library';

const GUESS_ROUNDS = 10;

type Source = 'likes' | 'random';

const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

type Round = { image: string; answer: GuessGame; choices: GuessGame[] };

function buildRound(pool: GuessGame[]): Round | null {
  const withShots = pool.filter((g) => g.screenshots.length > 0);
  if (withShots.length < 4) return null;
  const answer = pick(withShots);
  const image = pick(answer.screenshots);
  const distractors: GuessGame[] = [];
  const others = pool.filter((g) => g.id !== answer.id);
  const seen = new Set<number>();
  while (distractors.length < 3 && others.length > seen.size) {
    const g = pick(others);
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    distractors.push(g);
  }
  return { image, answer, choices: shuffle([answer, ...distractors]) };
}

export default function GuessScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();
  const { liked } = useLibrary();

  const [source, setSource] = useState<Source>('random');
  const [fellBack, setFellBack] = useState(false);
  const [pool, setPool] = useState<GuessGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null); // chosen game id
  const [roundNum, setRoundNum] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<'play' | 'result'>('play');

  const start = useCallback((p: GuessGame[]) => {
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBest(0);
    setRoundNum(1);
    setPhase('play');
    setRound(buildRound(p));
  }, []);

  // Load a pool for the chosen source. My Likes fetches screenshots for liked games; falls back to
  // Random when fewer than 4 liked games have usable screenshots.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setFellBack(false);
    (async () => {
      try {
        let games: GuessGame[] = [];
        if (source === 'likes') {
          games = await screenshotsForGames(liked.map((g) => g.id));
          if (games.length < 4) {
            if (active) setFellBack(true);
            games = await guessGames();
          }
        } else {
          games = await guessGames();
        }
        if (!active) return;
        if (games.length < 4) {
          setError(true);
          return;
        }
        setPool(games);
        start(games);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [source, liked, start]);

  const answered = picked !== null;

  const onPick = (id: number) => {
    if (answered || !round) return;
    const correct = id === round.answer.id;
    setPicked(id);
    if (correct) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setScore((s) => s + 1);
      setStreak((s) => {
        const n = s + 1;
        setBest((b) => (n > b ? n : b));
        return n;
      });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setStreak(0);
    }
  };

  const onNext = () => {
    Haptics.selectionAsync().catch(() => {});
    if (roundNum >= GUESS_ROUNDS) {
      setPhase('result');
      return;
    }
    setRoundNum((n) => n + 1);
    setPicked(null);
    setRound(buildRound(pool));
  };

  const Header = useMemo(
    () => (
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.text }]}>{t('play.guessTitle')}</Text>
        <View style={styles.backBtn} />
      </View>
    ),
    [c.text, insets.top, t],
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

  if (loading) {
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

  if (error || !round) {
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

  // ---- Result phase ----
  if (phase === 'result') {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {Header}
        <View style={styles.center}>
          <LinearGradient colors={[c.primary, '#FF5A67']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.resultBadge}>
            <Ionicons name="trophy" size={44} color="#fff" />
          </LinearGradient>
          <Text style={[styles.resultTitle, { color: c.text }]}>{t('play.resultTitle')}</Text>
          <Text style={[styles.resultScore, { color: c.primary }]}>
            {t('play.resultScore', { score, total: GUESS_ROUNDS })}
          </Text>
          <View style={[styles.streakPill, { backgroundColor: c.surface }]}>
            <Ionicons name="flame" size={16} color="#FB923C" />
            <Text style={[styles.streakPillText, { color: c.text }]}>{t('play.bestStreakLabel', { n: best })}</Text>
          </View>
          <Pressable onPress={() => start(pool)} style={[styles.nextBtn, styles.resultBtn, { backgroundColor: c.primary }]}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.nextText}>{t('play.vsReplay')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ---- Play phase ----
  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {Header}
      {SourceToggle}

      {/* Round progress */}
      <View style={styles.progressWrap}>
        <Text style={[styles.progressText, { color: c.muted }]}>
          {t('play.guessRoundLabel', { n: roundNum, total: GUESS_ROUNDS })}
        </Text>
        <View style={[styles.progressTrack, { backgroundColor: c.surface }]}>
          <View style={[styles.progressFill, { backgroundColor: c.primary, width: `${((roundNum - 1) / GUESS_ROUNDS) * 100}%` }]} />
        </View>
      </View>

      {/* Score pills */}
      <View style={styles.statRow}>
        <Pill c={c} icon="trophy" tint={c.primary} label={t('play.statScore')} value={score} />
        <Pill c={c} icon="flame" tint="#FB923C" label={t('play.statStreak')} value={streak} />
        <Pill c={c} icon="star" tint="#FBBF24" label={t('play.statBest')} value={best} />
      </View>

      {/* Screenshot */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: round.image }} style={styles.image} contentFit="cover" transition={220} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.45)']} style={StyleSheet.absoluteFill} pointerEvents="none" />
      </View>

      <Text style={[styles.prompt, { color: c.text }]}>{t('play.guessPrompt')}</Text>

      {/* Choices */}
      <View style={styles.choices}>
        {round.choices.map((g) => {
          const isAnswer = g.id === round.answer.id;
          const isPicked = g.id === picked;
          let bg = c.surface;
          let fg = c.text;
          if (answered && isAnswer) {
            bg = c.like;
            fg = '#fff';
          } else if (answered && isPicked && !isAnswer) {
            bg = c.dislike;
            fg = '#fff';
          }
          return (
            <Pressable
              key={g.id}
              disabled={answered}
              onPress={() => onPick(g.id)}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: bg },
                answered && !isAnswer && !isPicked && { opacity: 0.5 },
                pressed && !answered && { opacity: 0.85, transform: [{ scale: 0.99 }] },
              ]}
            >
              <Text numberOfLines={1} style={[styles.choiceText, { color: fg }]}>
                {g.name}
              </Text>
              {answered && isAnswer ? (
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
              ) : answered && isPicked ? (
                <Ionicons name="close-circle" size={22} color="#fff" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Next */}
      <Pressable
        onPress={onNext}
        disabled={!answered}
        style={[styles.nextBtn, { backgroundColor: c.primary, opacity: answered ? 1 : 0.35 }]}
      >
        <Text style={styles.nextText}>
          {roundNum >= GUESS_ROUNDS ? t('play.resultTitle') : t('play.nextRound')}
        </Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </Pressable>
    </View>
  );
}

function Pill({
  c,
  icon,
  tint,
  label,
  value,
}: {
  c: (typeof Colors)['dark'];
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tint: string;
  label: string;
  value: number;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: c.surface }]}>
      <Ionicons name={icon} size={16} color={tint} />
      <Text style={[styles.pillValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.pillLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 24 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800' },
  errTitle: { fontSize: 18, fontWeight: '700', marginTop: 6 },
  errSub: { fontSize: 14 },
  sourceWrap: { paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segItem: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: 'center' },
  segText: { fontSize: 13, fontWeight: '700' },
  fellBack: { fontSize: 12, textAlign: 'center' },
  progressWrap: { paddingHorizontal: 16, gap: 6, marginBottom: 12 },
  progressText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 14 },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 999,
  },
  pillValue: { fontSize: 18, fontWeight: '900' },
  pillLabel: { fontSize: 11, fontWeight: '600' },
  imageWrap: {
    marginHorizontal: 16,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  image: { width: '100%', height: '100%' },
  prompt: { textAlign: 'center', fontSize: 18, fontWeight: '800', marginTop: 18, marginBottom: 14 },
  choices: { paddingHorizontal: 16, gap: 10 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 16,
  },
  choiceText: { flex: 1, fontSize: 15, fontWeight: '700' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 18,
    height: 54,
    borderRadius: 16,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  // result
  resultBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  resultTitle: { fontSize: 24, fontWeight: '900' },
  resultScore: { fontSize: 34, fontWeight: '900', marginTop: 2 },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  streakPillText: { fontSize: 14, fontWeight: '700' },
  resultBtn: { alignSelf: 'stretch', marginTop: 20 },
});
