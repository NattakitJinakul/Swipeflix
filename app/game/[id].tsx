/**
 * Game detail screen (stack route /game/[id]). Swipeable screenshots hero, meta row
 * (rating · platform · genre · year), summary, YouTube trailer (react-native-youtube-iframe),
 * "เว็บ/ร้านค้า" website links (expo-web-browser), same-genre related (similar), floating
 * decision bar. Guest like/played prompts login (IGDB — rich data, trailers, store links).
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
import YoutubePlayer from 'react-native-youtube-iframe';

import { ActionButton, ACTION_COLORS } from '@/components/ActionButton';
import { EmptyState } from '@/components/EmptyState';
import { gameImage } from '@/components/game-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';
import { useGameDetail } from '@/src/hooks/useGameDetail';
import { useAuth } from '@/src/store/auth';
import { useLibrary } from '@/src/store/library';
import type { GameLite } from '@/src/types/game';

const { width: SCREEN_W } = Dimensions.get('window');
const HERO_H = 220;

// IGDB website type -> label + icon + BRAND color (real brand colors, not app theme).
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type SiteInfo = { label: string; icon: IoniconName; color: string };
const SITES: Record<number, SiteInfo> = {
  1: { label: 'Official', icon: 'globe-outline', color: '#4CAF50' },
  2: { label: 'Wiki', icon: 'book-outline', color: '#8E9AAF' },
  3: { label: 'Wikipedia', icon: 'book-outline', color: '#8E9AAF' },
  4: { label: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
  5: { label: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
  6: { label: 'Twitch', icon: 'logo-twitch', color: '#9146FF' },
  8: { label: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  9: { label: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  10: { label: 'App Store', icon: 'logo-apple', color: '#0D96F6' },
  11: { label: 'App Store', icon: 'logo-apple', color: '#0D96F6' },
  12: { label: 'Google Play', icon: 'logo-google-playstore', color: '#00C853' },
  13: { label: 'Steam', icon: 'logo-steam', color: '#66C0F4' },
  14: { label: 'Reddit', icon: 'logo-reddit', color: '#FF4500' },
  15: { label: 'itch.io', icon: 'game-controller-outline', color: '#FA5C5C' },
  16: { label: 'Epic Games', icon: 'game-controller-outline', color: '#E6E6E6' },
  17: { label: 'GOG', icon: 'game-controller-outline', color: '#A259FF' },
  18: { label: 'Discord', icon: 'logo-discord', color: '#5865F2' },
  19: { label: 'Bluesky', icon: 'cloud-outline', color: '#0085FF' },
  22: { label: 'Xbox', icon: 'logo-xbox', color: '#107C10' },
  23: { label: 'PlayStation', icon: 'logo-playstation', color: '#0070D1' },
  24: { label: 'Nintendo', icon: 'game-controller-outline', color: '#E60012' },
  25: { label: 'Meta', icon: 'logo-facebook', color: '#0668E1' },
  26: { label: 'GameJolt', icon: 'game-controller-outline', color: '#2EE6A6' },
};
const siteInfo = (cat: number): SiteInfo =>
  SITES[cat] ?? { label: 'Website', icon: 'open-outline', color: '#9CA3AF' };
// Stores + official first, then socials.
const SITE_ORDER = [1, 13, 23, 22, 24, 16, 17, 15, 12, 10, 11, 9, 18, 6, 5, 4, 8, 14, 26, 25, 19, 3, 2];
const siteRank = (cat: number): number => {
  const i = SITE_ORDER.indexOf(cat);
  return i === -1 ? 99 : i;
};

export default function GameDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = Number(id);
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const t = useT();

  const {
    detail,
    loading,
    error,
    summary,
    developers,
    publishers,
    genres,
    platforms,
    screenshots,
    trailerYoutubeId,
    websites,
    similar,
    releaseYear,
    rating,
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
    Alert.alert(t('guest.title'), t('guest.body'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.signIn'), onPress: () => router.push('/(auth)/login') },
    ]);
    return true;
  };

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
      message: `${detail.name}${detail.year ? ` (${detail.year})` : ''} ${t('detail.shareSuffix')}`,
    }).catch(() => {});
  };

  const openSite = (url: string) => {
    void WebBrowser.openBrowserAsync(url).catch(() => {});
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
          title={t('detail.errorTitle')}
          subtitle={t('detail.errorSub')}
          actionLabel={t('common.back')}
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const heroUris = (screenshots.length ? screenshots : detail.image ? [detail.image] : [])
    .map((u) => gameImage(u))
    .filter((u): u is string => !!u);

  const meta = [
    rating != null ? `⭐ ${Math.round(rating)}/100` : null,
    platforms[0] ?? null,
    genres[0] ?? null,
    releaseYear ? String(releaseYear) : null,
  ].filter((m): m is string => !!m);

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

        {/* In-library hint */}
        {inLibrary ? (
          <View style={[styles.libHint, { backgroundColor: c.surface }]}>
            <Ionicons name="checkmark" size={16} color={c.like} />
            <Text style={[styles.libHintText, { color: c.text }]}>{t('detail.inLibrary')}</Text>
          </View>
        ) : null}

        {/* Summary */}
        {summary ? (
          <Section title={t('detail.about')} color={c.text}>
            <Text style={[styles.body, { color: c.muted }]}>{summary}</Text>
          </Section>
        ) : null}

        {/* Trailer (YouTube) */}
        {trailerYoutubeId ? (
          <Section title={t('detail.trailer')} color={c.text}>
            <View style={styles.trailer}>
              <YoutubePlayer height={SCREEN_W * 0.5625} videoId={trailerYoutubeId} play={false} />
            </View>
          </Section>
        ) : null}

        {/* Genre chips */}
        {genres.length ? (
          <View style={styles.chipRow}>
            {genres.map((g) => (
              <View key={g} style={[styles.chip, { backgroundColor: c.surface }]}>
                <Text style={[styles.chipText, { color: c.text }]}>{g}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Studios */}
        {developers.length || publishers.length ? (
          <Section title={t('detail.studios')} color={c.text}>
            {developers.length ? (
              <Text style={[styles.body, { color: c.muted }]}>
                {t('detail.developer')}: <Text style={{ color: c.text, fontWeight: '700' }}>{developers.join(' · ')}</Text>
              </Text>
            ) : null}
            {publishers.length ? (
              <Text style={[styles.body, { color: c.muted }]}>{t('detail.publisher')}: {publishers.join(' · ')}</Text>
            ) : null}
          </Section>
        ) : null}

        {/* Websites / stores */}
        {websites.length ? (
          <Section title={t('detail.sites')} color={c.text}>
            <View style={styles.chipWrap}>
              {[...websites]
                .sort((a, b) => siteRank(a.category) - siteRank(b.category))
                .map((w) => {
                  const info = siteInfo(w.category);
                  const label =
                    w.category === 1
                      ? t('detail.officialSite')
                      : SITES[w.category]
                        ? info.label
                        : t('detail.website');
                  return (
                    <Pressable
                      key={`${w.category}-${w.url}`}
                      onPress={() => openSite(w.url)}
                      style={({ pressed }) => [
                        styles.storeChip,
                        { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
                      ]}
                    >
                      <Ionicons name={info.icon} size={16} color={info.color} />
                      <Text style={[styles.chipText, { color: c.text }]}>{label}</Text>
                    </Pressable>
                  );
                })}
            </View>
          </Section>
        ) : null}

        {/* Similar games */}
        {similar.length ? (
          <Section title={t('detail.similar')} color={c.text}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {similar.map((g: GameLite) => {
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
  libHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  libHintText: { fontSize: 13, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  storeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  trailer: { borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  hRow: { gap: 12, paddingRight: 16 },
  posterFallback: { alignSelf: 'center', marginTop: '30%' },
  seriesCard: { width: 120 },
  seriesPoster: { width: 120, height: 160, borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  seriesTitle: { fontSize: 12, fontWeight: '600' },
});
