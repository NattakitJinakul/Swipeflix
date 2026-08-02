/**
 * Game detail screen (stack route /game/[id]). Swipeable screenshots hero, meta row
 * (platform · genre · year), description, "เล่นเลย (ฟรี)" primary button -> game_url,
 * minimum system requirements, same-genre related row, floating decision bar.
 * FreeToGame has no trailers/stores/rating. Guest like/played prompts login.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionButton, ACTION_COLORS } from '@/components/ActionButton';
import { EmptyState } from '@/components/EmptyState';
import { gameImage } from '@/components/tmdb-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useGameDetail } from '@/src/hooks/useGameDetail';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 220;

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = Number(id);
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const {
    detail,
    loading,
    error,
    description,
    developer,
    publisher,
    platform,
    genre,
    releaseYear,
    gameUrl,
    sysReq,
    screenshots,
    related,
  } = useGameDetail(Number.isFinite(gameId) ? gameId : null);
  const { isGuest } = useAuth();
  const { liked, like, dislike, markPlayed } = useLibrary();
  const [heroIdx, setHeroIdx] = useState(0);

  // Fade the floating decision bar out while scrolling, back in when it settles.
  const barOpacity = useSharedValue(1);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barStyle = useAnimatedStyle(() => ({ opacity: barOpacity.value }));
  const onScrollActivity = () => {
    barOpacity.value = withTiming(0, { duration: 140 });
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      barOpacity.value = withTiming(1, { duration: 260 });
    }, 450);
  };

  const inLibrary = detail ? liked.some((g) => g.id === detail.id) : false;

  // Guest save prompt — like/played require login. Returns true when the action must be blocked.
  const promptLogin = (): boolean => {
    if (!isGuest) return false;
    Alert.alert('เข้าสู่ระบบ', 'บันทึกเกมที่ชอบต้องเข้าสู่ระบบก่อน', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'เข้าสู่ระบบ', onPress: () => router.push('/(auth)/login') },
    ]);
    return true;
  };

  // Save actions gate on guest; skip (dislike) is always allowed. Then go back.
  const save = (fn: () => void) => {
    if (promptLogin()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    fn();
    router.back();
  };
  const skip = () => {
    if (!detail) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    dislike(detail.id);
    router.back();
  };

  const onShare = () => {
    if (!detail) return;
    void Share.share({
      message: `${detail.name}${detail.year ? ` (${detail.year})` : ''} — เจอใน Swipeplay 🎮`,
    }).catch(() => {});
  };

  const play = () => {
    if (!gameUrl) return;
    void WebBrowser.openBrowserAsync(gameUrl).catch(() => {});
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <EmptyState
          icon="alert-circle-outline"
          title="โหลดข้อมูลไม่สำเร็จ"
          subtitle="ตรวจสอบการเชื่อมต่อแล้วลองใหม่"
          actionLabel="กลับ"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const heroUris = (screenshots.length ? screenshots : detail.image ? [detail.image] : [])
    .map((u) => gameImage(u))
    .filter((u): u is string => !!u);

  const meta = [platform, genre, releaseYear ? String(releaseYear) : null].filter(
    (m): m is string => !!m,
  );

  const sysRows: { label: string; value?: string }[] = sysReq
    ? [
        { label: 'OS', value: sysReq.os },
        { label: 'CPU', value: sysReq.processor },
        { label: 'RAM', value: sysReq.memory },
        { label: 'GPU', value: sysReq.graphics },
        { label: 'พื้นที่', value: sysReq.storage },
      ].filter((r) => !!r.value)
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: c.background }}>
      {/* Floating top controls */}
      <View style={[styles.topControls, { top: insets.top + 6 }]}>
        <CircleIcon icon="chevron-back" onPress={() => router.back()} />
        <CircleIcon icon="share-outline" onPress={onShare} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 104 }}
        onScroll={onScrollActivity}
        scrollEventThrottle={16}
      >
        {/* Hero: swipeable screenshots gallery */}
        <View style={styles.heroWrap}>
          {heroUris.length ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) =>
                setHeroIdx(Math.round(e.nativeEvent.contentOffset.x / SCREEN_W))
              }
            >
              {heroUris.map((uri, i) => (
                <Image
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  style={{ width: SCREEN_W, height: HERO_H }}
                  contentFit="cover"
                  transition={200}
                />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroFallback, { backgroundColor: c.surface }]}>
              <Ionicons name="game-controller-outline" size={56} color={c.muted} />
            </View>
          )}
          <View
            style={[StyleSheet.absoluteFill, styles.heroScrim, { backgroundColor: c.background }]}
            pointerEvents="none"
          />
          {heroUris.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {heroUris.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i === heroIdx ? '#fff' : 'rgba(255,255,255,0.4)',
                      width: i === heroIdx ? 18 : 6,
                    },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Title + meta */}
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: c.text }]}>{detail.name}</Text>
          {meta.length ? (
            <View style={styles.metaRow}>
              {meta.map((m, i) => (
                <Text key={`${m}-${i}`} style={[styles.meta, { color: c.muted }]}>
                  {m}
                </Text>
              ))}
            </View>
          ) : null}
        </View>

        {/* Play (free) primary CTA */}
        {gameUrl ? (
          <Pressable
            onPress={play}
            style={({ pressed }) => [
              styles.libBtn,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="play" size={18} color="#fff" />
            <Text style={[styles.libBtnText, { color: '#fff' }]}>เล่นเลย (ฟรี)</Text>
          </Pressable>
        ) : null}

        {/* In-library hint */}
        {inLibrary ? (
          <View style={[styles.libHint, { backgroundColor: c.surface }]}>
            <Ionicons name="checkmark" size={16} color={c.like} />
            <Text style={[styles.libHintText, { color: c.text }]}>อยู่ในคลังแล้ว</Text>
          </View>
        ) : null}

        {/* Description */}
        {description ? (
          <Section title="เกี่ยวกับเกม" color={c.text}>
            <Text style={[styles.body, { color: c.muted }]}>{description}</Text>
          </Section>
        ) : null}

        {/* Studios */}
        {developer || publisher ? (
          <Section title="ทีมพัฒนา" color={c.text}>
            {developer ? (
              <Text style={[styles.body, { color: c.muted }]}>
                ผู้พัฒนา: <Text style={{ color: c.text, fontWeight: '700' }}>{developer}</Text>
              </Text>
            ) : null}
            {publisher ? (
              <Text style={[styles.body, { color: c.muted }]}>ผู้จัดจำหน่าย: {publisher}</Text>
            ) : null}
          </Section>
        ) : null}

        {/* Minimum system requirements */}
        {sysRows.length ? (
          <Section title="สเปคขั้นต่ำ" color={c.text}>
            <View style={[styles.card, { backgroundColor: c.surface }]}>
              {sysRows.map((r) => (
                <View key={r.label} style={styles.sysRow}>
                  <Text style={[styles.sysLabel, { color: c.muted }]}>{r.label}</Text>
                  <Text style={[styles.sysValue, { color: c.text }]}>{r.value}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {/* Same genre related */}
        {related.length ? (
          <Section title="เกมแนวเดียวกัน" color={c.text}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {related.map((g: GameLite) => {
                const uri = gameImage(g.image);
                return (
                  <Pressable
                    key={g.id}
                    onPress={() => router.push(`/game/${g.id}`)}
                    style={({ pressed }) => [styles.seriesCard, { opacity: pressed ? 0.75 : 1 }]}
                  >
                    <View style={[styles.seriesPoster, { backgroundColor: c.surface }]}>
                      {uri ? (
                        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                      ) : (
                        <Ionicons name="game-controller-outline" size={26} color={c.muted} style={styles.posterFallback} />
                      )}
                    </View>
                    <Text style={[styles.seriesTitle, { color: c.text }]} numberOfLines={2}>{g.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Section>
        ) : null}
      </ScrollView>

      {/* Floating decision bar (fades while scrolling) */}
      <Animated.View style={[styles.floatBar, barStyle, { bottom: insets.bottom + 2 }]} pointerEvents="box-none">
        <ActionButton icon="thumbs-down" color={ACTION_COLORS.dislike} size={54} onPress={skip} />
        <ActionButton icon="game-controller" color={ACTION_COLORS.watched} size={54} onPress={() => save(() => markPlayed(detail))} />
        <ActionButton icon="heart" color={ACTION_COLORS.like} size={62} onPress={() => save(() => like(detail))} />
      </Animated.View>
    </View>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function CircleIcon({ icon, onPress }: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={8} style={({ pressed }) => [styles.circleIcon, { opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name={icon} size={22} color="#fff" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  floatBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  topControls: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  circleIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroWrap: { height: HERO_H, width: '100%' },
  heroFallback: { height: HERO_H, alignItems: 'center', justifyContent: 'center' },
  heroScrim: { opacity: 0.28 },
  dots: { position: 'absolute', bottom: 16, alignSelf: 'center', flexDirection: 'row', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  titleBlock: { paddingHorizontal: 16, marginTop: 14 },
  title: { fontSize: 24, fontWeight: '900' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, marginTop: 8 },
  meta: { fontSize: 14, fontWeight: '600' },
  libBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  libBtnText: { fontWeight: '800', fontSize: 15 },
  libHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  libHintText: { fontSize: 13, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  card: { borderRadius: 14, padding: 14, gap: 10 },
  sysRow: { flexDirection: 'row', gap: 12 },
  sysLabel: { width: 52, fontSize: 13, fontWeight: '700' },
  sysValue: { flex: 1, fontSize: 13 },
  hRow: { gap: 12, paddingRight: 16 },
  posterFallback: { alignSelf: 'center', marginTop: '30%' },
  seriesCard: { width: 150 },
  seriesPoster: { width: 150, height: 84, borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  seriesTitle: { fontSize: 12, fontWeight: '600' },
});
