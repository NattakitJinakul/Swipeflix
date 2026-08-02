/**
 * "เกมอะไรเอ่ย?" — guess the game from one of its screenshots.
 * Endless: each round shows a random screenshot + 4 name choices (1 correct, 3 distractors).
 * Tap -> reveal correct(green)/wrong(red) + haptic, bump score/streak, "ถัดไป" for next.
 * Tracks score, current streak, best streak. Guest-friendly.
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
import { guessGames, type GuessGame } from '@/src/api/endpoints';

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

  const [pool, setPool] = useState<GuessGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [round, setRound] = useState<Round | null>(null);
  const [picked, setPicked] = useState<number | null>(null); // chosen game id
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);

  const next = useCallback((p: GuessGame[]) => {
    setPicked(null);
    setRound(buildRound(p));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    guessGames()
      .then((games) => {
        if (!active) return;
        if (games.length < 4) {
          setError(true);
          return;
        }
        setPool(games);
        next(games);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [next]);

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

  const header = useMemo(
    () => (
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable hitSlop={10} onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={26} color={c.text} />
        </Pressable>
        <Text style={[styles.topTitle, { color: c.text }]}>เกมอะไรเอ่ย?</Text>
        <View style={styles.backBtn} />
      </View>
    ),
    [c.text, insets.top],
  );

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: c.background }]}>
        {header}
        <ActivityIndicator size="large" color={c.primary} />
      </View>
    );
  }

  if (error || !round) {
    return (
      <View style={[styles.root, { backgroundColor: c.background }]}>
        {header}
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={48} color={c.muted} />
          <Text style={[styles.errTitle, { color: c.text }]}>โหลดเกมไม่สำเร็จ</Text>
          <Text style={[styles.errSub, { color: c.muted }]}>ลองใหม่อีกครั้ง</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      {header}

      {/* Score row */}
      <View style={styles.statRow}>
        <Stat c={c} icon="trophy" label="คะแนน" value={score} />
        <Stat c={c} icon="flame" label="สตรีค" value={streak} accent />
        <Stat c={c} icon="star" label="สูงสุด" value={best} />
      </View>

      {/* Screenshot */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: round.image }} style={styles.image} contentFit="cover" transition={220} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.35)']}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </View>

      <Text style={[styles.prompt, { color: c.muted }]}>นี่คือเกมอะไร?</Text>

      {/* Choices */}
      <View style={styles.choices}>
        {round.choices.map((g) => {
          const isAnswer = g.id === round.answer.id;
          const isPicked = g.id === picked;
          let bg = c.surface;
          let border = 'transparent';
          let fg = c.text;
          if (answered && isAnswer) {
            bg = c.like;
            fg = '#fff';
          } else if (answered && isPicked && !isAnswer) {
            bg = c.dislike;
            fg = '#fff';
          } else if (answered) {
            border = 'transparent';
          }
          return (
            <Pressable
              key={g.id}
              disabled={answered}
              onPress={() => onPick(g.id)}
              style={({ pressed }) => [
                styles.choice,
                { backgroundColor: bg, borderColor: border },
                pressed && !answered && { opacity: 0.85 },
              ]}
            >
              <Text numberOfLines={1} style={[styles.choiceText, { color: fg }]}>
                {g.name}
              </Text>
              {answered && isAnswer ? (
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              ) : answered && isPicked ? (
                <Ionicons name="close-circle" size={20} color="#fff" />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      {/* Next */}
      {answered ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            next(pool);
          }}
          style={[styles.nextBtn, { backgroundColor: c.primary }]}
        >
          <Text style={styles.nextText}>ถัดไป</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </Pressable>
      ) : (
        <View style={[styles.nextBtn, { opacity: 0 }]} pointerEvents="none">
          <Text style={styles.nextText}>ถัดไป</Text>
        </View>
      )}
    </View>
  );
}

function Stat({
  c,
  icon,
  label,
  value,
  accent,
}: {
  c: (typeof Colors)['dark'];
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: c.surface }]}>
      <Ionicons name={icon} size={16} color={accent ? c.primary : c.muted} />
      <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
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
  statRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 14, gap: 2 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11 },
  imageWrap: {
    marginHorizontal: 16,
    height: 220,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: { width: '100%', height: '100%' },
  prompt: { textAlign: 'center', fontSize: 14, fontWeight: '600', marginTop: 16, marginBottom: 12 },
  choices: { paddingHorizontal: 16, gap: 10 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  choiceText: { flex: 1, fontSize: 15, fontWeight: '700' },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 18,
    height: 52,
    borderRadius: 16,
  },
  nextText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
