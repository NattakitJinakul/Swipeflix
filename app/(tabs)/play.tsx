/**
 * "สนุก" hub — landing for the mini-games. A bold gradient hero + two big illustrated
 * game cards (gradient, large icon, description, Play affordance). Guest-friendly.
 */
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type Game = {
  key: string;
  titleKey: string;
  subKey: string;
  icon: IoniconName;
  colors: [string, string];
  href: '/play/guess' | '/play/vs';
};

const GAMES: Game[] = [
  {
    key: 'guess',
    titleKey: 'play.guessTitle',
    subKey: 'play.guessSub',
    icon: 'help-circle',
    colors: ['#E50914', '#FF5A67'],
    href: '/play/guess',
  },
  {
    key: 'vs',
    titleKey: 'play.vsTitle',
    subKey: 'play.vsSub',
    icon: 'git-compare',
    colors: ['#6D28D9', '#3B82F6'],
    href: '/play/vs',
  },
];

export default function PlayHub() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const open = (href: Game['href']) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    router.push(href);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 36, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <LinearGradient
          colors={[c.primary, '#FF5A67']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.heroIcon}>
            <Ionicons name="game-controller" size={30} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>{t('play.hubTitle')}</Text>
          <Text style={styles.heroSub}>{t('play.hubSub')}</Text>
        </LinearGradient>

        {/* Game cards */}
        <View style={styles.cards}>
          {GAMES.map((g) => (
            <Pressable
              key={g.key}
              onPress={() => open(g.href)}
              style={({ pressed }) => [styles.cardWrap, pressed && { transform: [{ scale: 0.98 }], opacity: 0.96 }]}
            >
              <LinearGradient colors={g.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
                {/* faint oversized backdrop icon */}
                <Ionicons name={g.icon} size={150} color="rgba(255,255,255,0.12)" style={styles.cardGhost} />
                <View style={styles.iconBadge}>
                  <Ionicons name={g.icon} size={32} color="#fff" />
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{t(g.titleKey)}</Text>
                  <Text style={styles.cardSub}>{t(g.subKey)}</Text>
                  <View style={styles.playPill}>
                    <Ionicons name="play" size={13} color="#fff" />
                    <Text style={styles.playPillText}>{t('play.playCta')}</Text>
                  </View>
                </View>
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
  hero: {
    borderRadius: 24,
    padding: 22,
    gap: 6,
    marginBottom: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 6,
  },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -0.5 },
  heroSub: { color: 'rgba(255,255,255,0.92)', fontSize: 14, lineHeight: 19 },
  cards: { gap: 16 },
  cardWrap: {
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    minHeight: 150,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 20,
    overflow: 'hidden',
  },
  cardGhost: { position: 'absolute', right: -20, bottom: -30 },
  iconBadge: {
    width: 66,
    height: 66,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardBody: { flex: 1, gap: 6 },
  cardTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  cardSub: { color: 'rgba(255,255,255,0.92)', fontSize: 13, lineHeight: 18 },
  playPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  playPillText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
});
