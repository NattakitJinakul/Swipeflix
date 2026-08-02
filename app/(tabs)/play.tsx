/**
 * "สนุก" hub — landing for the mini-games. Two big gradient cards:
 *   • เกมอะไรเอ่ย?  (guess the game from a screenshot)   -> /play/guess
 *   • VS ตัวต่อตัว   (pick your favourite, head-to-head)  -> /play/vs
 * Guest-friendly, themed via Colors + useColorScheme.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Game = {
  key: string;
  title: string;
  subtitle: string;
  icon: IoniconName;
  colors: [string, string];
  href: '/play/guess' | '/play/vs';
};

const GAMES: Game[] = [
  {
    key: 'guess',
    title: 'เกมอะไรเอ่ย?',
    subtitle: 'ทายชื่อเกมจากภาพในเกม เก็บสตรีคให้ยาวที่สุด',
    icon: 'help-circle',
    colors: ['#E50914', '#FF5A67'],
    href: '/play/guess',
  },
  {
    key: 'vs',
    title: 'VS ตัวต่อตัว',
    subtitle: 'สองเกมประชันกัน เลือกอันที่ชอบกว่า แล้วดูอันดับ',
    icon: 'git-compare',
    colors: ['#6D28D9', '#3B82F6'],
    href: '/play/vs',
  },
];

export default function PlayHub() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const open = (href: Game['href']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(href);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: c.text }]}>สนุก</Text>
        <Text style={[styles.sub, { color: c.muted }]}>เล่นเกมสั้น ๆ ระหว่างเลือกเกมถัดไป</Text>

        <View style={styles.cards}>
          {GAMES.map((g) => (
            <Pressable
              key={g.key}
              onPress={() => open(g.href)}
              style={({ pressed }) => [styles.cardWrap, pressed && { transform: [{ scale: 0.98 }], opacity: 0.95 }]}
            >
              <LinearGradient
                colors={g.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.iconBadge}>
                  <Ionicons name={g.icon} size={30} color="#fff" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{g.title}</Text>
                  <Text style={styles.cardSub}>{g.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.9)" />
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  sub: { fontSize: 14, marginTop: 4, marginBottom: 22 },
  cards: { gap: 16 },
  cardWrap: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 130,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
  },
  iconBadge: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardBody: { flex: 1 },
  cardTitle: { color: '#fff', fontSize: 21, fontWeight: '800' },
  cardSub: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 6, lineHeight: 18 },
});
