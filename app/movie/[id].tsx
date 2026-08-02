/**
 * Movie detail screen (stack route /movie/[id]). Backdrop + poster + meta, genre chips,
 * runtime, overview (+ LangBadge on th->en fallback), cast row, director/companies,
 * YouTube trailer, "ดูได้ที่" providers (affiliate links via expo-web-browser),
 * recommendations row, add-to-watchlist + Share. See docs/02 · docs/04 · docs/05 · docs/11.
 */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
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

import { ActionButton, ACTION_COLORS, ACTION_ICONS } from '@/components/ActionButton';
import { EmptyState } from '@/components/EmptyState';
import { LangBadge } from '@/components/LangBadge';
import { posterUri } from '@/components/tmdb-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useMovieDetail } from '@/src/hooks/useMovieDetail';
import { useLibrary } from '@/src/store/library';
import type { MovieLite } from '@/src/types/movie';
import { affiliateUrl } from '@/src/utils/affiliate';

const { width: SCREEN_W } = Dimensions.get('window');

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = Number(id);
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const { detail, loading, error, overview, overviewFallback, director, cast, trailerKey, providers, recommendations, runtimeLabel, backdrops } =
    useMovieDetail(Number.isFinite(movieId) ? movieId : null);
  const { liked, like, dislike, markWatched } = useLibrary();
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

  const inWatchlist = detail ? liked.some((m) => m.id === detail.id) : false;

  const act = (fn: () => void) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    fn();
    router.back();
  };

  const onShare = () => {
    if (!detail) return;
    void Share.share({
      message: `${detail.title}${detail.year ? ` (${detail.year})` : ''} — เจอใน Swipeflix 🍿`,
    }).catch(() => {});
  };

  const openProvider = (name: string) => {
    if (!detail) return;
    const url = affiliateUrl(name, detail.title, `https://www.themoviedb.org/movie/${detail.id}/watch`);
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
          title="โหลดข้อมูลไม่สำเร็จ"
          subtitle="ตรวจสอบการเชื่อมต่อแล้วลองใหม่"
          actionLabel="กลับ"
          onAction={() => router.back()}
        />
      </View>
    );
  }

  const heroUris = (backdrops.length ? backdrops : detail.backdrop ? [detail.backdrop] : [])
    .map((p) => posterUri(p, 'w780'))
    .filter((u): u is string => !!u);
  if (!heroUris.length) {
    const fallback = posterUri(detail.poster, 'w780');
    if (fallback) heroUris.push(fallback);
  }
  const posterSmall = posterUri(detail.poster, 'w342');

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
        {/* Hero: swipeable backdrop gallery */}
        <View style={styles.backdropWrap}>
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
                style={{ width: SCREEN_W, height: BACKDROP_H }}
                contentFit="cover"
                transition={200}
              />
            ))}
          </ScrollView>
          <View style={[StyleSheet.absoluteFill, styles.backdropScrim, { backgroundColor: c.background }]} pointerEvents="none" />
          {heroUris.length > 1 ? (
            <View style={styles.dots} pointerEvents="none">
              {heroUris.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: i === heroIdx ? '#fff' : 'rgba(255,255,255,0.4)', width: i === heroIdx ? 18 : 6 },
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        {/* Header: poster + title block */}
        <View style={[styles.headerRow, { marginTop: -60 }]}>
          <View style={[styles.posterBox, { backgroundColor: c.surface }]}>
            {posterSmall ? (
              <Image source={{ uri: posterSmall }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <Ionicons name="film-outline" size={40} color={c.muted} style={styles.posterFallback} />
            )}
          </View>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: c.text }]}>{detail.title}</Text>
            <View style={styles.metaRow}>
              {detail.year ? <Text style={[styles.meta, { color: c.muted }]}>{detail.year}</Text> : null}
              <View style={styles.ratingPill}>
                <Ionicons name="star" size={13} color="#F5C518" />
                <Text style={styles.ratingText}>{detail.rating.toFixed(1)}</Text>
              </View>
              {runtimeLabel ? <Text style={[styles.meta, { color: c.muted }]}>{runtimeLabel}</Text> : null}
            </View>
          </View>
        </View>

        {/* Genre chips */}
        {detail.genres.length ? (
          <View style={styles.chipRow}>
            {detail.genres.map((g) => (
              <View key={g.id} style={[styles.chip, { backgroundColor: c.surface }]}>
                <Text style={[styles.chipText, { color: c.text }]}>{g.name}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Add to watchlist */}
        <Pressable
          onPress={() => like(detail)}
          disabled={inWatchlist}
          style={({ pressed }) => [
            styles.watchBtn,
            { backgroundColor: inWatchlist ? c.surface : c.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Ionicons name={inWatchlist ? 'checkmark' : 'heart'} size={18} color={inWatchlist ? c.like : '#fff'} />
          <Text style={[styles.watchBtnText, { color: inWatchlist ? c.text : '#fff' }]}>
            {inWatchlist ? 'อยู่ใน watchlist แล้ว' : 'เพิ่มเข้า watchlist'}
          </Text>
        </Pressable>

        {/* Overview */}
        {overview ? (
          <Section title="เรื่องย่อ" color={c.text}>
            {overviewFallback ? (
              <View style={styles.langRow}>
                <LangBadge label="🌐 แสดงเป็นภาษาอังกฤษ" />
              </View>
            ) : null}
            <Text style={[styles.body, { color: c.muted }]}>{overview}</Text>
          </Section>
        ) : null}

        {/* Cast */}
        {cast.length ? (
          <Section title="นักแสดง" color={c.text}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {cast.map((p) => {
                const uri = posterUri(p.profile, 'w185');
                return (
                  <View key={p.id} style={styles.castCard}>
                    <View style={[styles.castImg, { backgroundColor: c.surface }]}>
                      {uri ? (
                        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                      ) : (
                        <Ionicons name="person" size={28} color={c.muted} style={styles.posterFallback} />
                      )}
                    </View>
                    <Text style={[styles.castName, { color: c.text }]} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.castChar, { color: c.muted }]} numberOfLines={1}>{p.character}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </Section>
        ) : null}

        {/* Crew */}
        {director || detail.productionCompanies.length ? (
          <Section title="ทีมงาน" color={c.text}>
            {director ? (
              <Text style={[styles.body, { color: c.muted }]}>
                ผู้กำกับ: <Text style={{ color: c.text, fontWeight: '700' }}>{director.name}</Text>
              </Text>
            ) : null}
            {detail.productionCompanies.length ? (
              <Text style={[styles.body, { color: c.muted }]}>
                ค่าย: {detail.productionCompanies.map((p) => p.name).join(' · ')}
              </Text>
            ) : null}
          </Section>
        ) : null}

        {/* Trailer */}
        {trailerKey ? (
          <Section title="ตัวอย่าง" color={c.text}>
            <View style={styles.trailer}>
              <YoutubePlayer height={210} videoId={trailerKey} />
            </View>
          </Section>
        ) : null}

        {/* Providers */}
        {providers.length ? (
          <Section title="ดูได้ที่" color={c.text}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {providers.map((p) => {
                const logo = posterUri(p.logo, 'w185');
                return (
                  <Pressable
                    key={p.providerId}
                    onPress={() => openProvider(p.providerName)}
                    style={({ pressed }) => [styles.provider, { opacity: pressed ? 0.7 : 1 }]}
                  >
                    <View style={[styles.providerLogo, { backgroundColor: c.surface }]}>
                      {logo ? (
                        <Image source={{ uri: logo }} style={StyleSheet.absoluteFill} contentFit="contain" />
                      ) : null}
                    </View>
                    <Text style={[styles.providerName, { color: c.muted }]} numberOfLines={1}>{p.providerName}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Section>
        ) : null}

        {/* Recommendations */}
        {recommendations.length ? (
          <Section title="หนังที่เกี่ยวข้อง" color={c.text}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hRow}>
              {recommendations.map((m: MovieLite) => {
                const uri = posterUri(m.poster, 'w342');
                return (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push(`/movie/${m.id}`)}
                    style={({ pressed }) => [styles.recCard, { opacity: pressed ? 0.75 : 1 }]}
                  >
                    <View style={[styles.recPoster, { backgroundColor: c.surface }]}>
                      {uri ? (
                        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
                      ) : (
                        <Ionicons name="film-outline" size={26} color={c.muted} style={styles.posterFallback} />
                      )}
                    </View>
                    <Text style={[styles.recTitle, { color: c.text }]} numberOfLines={2}>{m.title}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </Section>
        ) : null}
      </ScrollView>

      {/* Floating decision bar (fades while scrolling) */}
      <Animated.View style={[styles.floatBar, barStyle, { bottom: insets.bottom + 2 }]} pointerEvents="box-none">
        <ActionButton icon={ACTION_ICONS.dislike} color={ACTION_COLORS.dislike} size={54} onPress={() => act(() => dislike(detail.id))} />
        <ActionButton icon={ACTION_ICONS.watched} color={ACTION_COLORS.watched} size={54} onPress={() => act(() => markWatched(detail))} />
        <ActionButton icon={ACTION_ICONS.like} color={ACTION_COLORS.like} size={62} onPress={() => act(() => like(detail))} />
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

const BACKDROP_H = 240;

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
  backdropWrap: { height: BACKDROP_H, width: '100%' },
  backdropScrim: { opacity: 0.35 },
  dots: {
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  dot: { height: 6, borderRadius: 3 },
  headerRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 14 },
  posterBox: {
    width: 110,
    height: 165,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  posterFallback: { alignSelf: 'center', marginTop: '55%' },
  titleBlock: { flex: 1, justifyContent: 'flex-end', paddingBottom: 6 },
  title: { fontSize: 22, fontWeight: '900' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  meta: { fontSize: 14, fontWeight: '600' },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: '#F5C518', fontWeight: '800', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  watchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  watchBtnText: { fontWeight: '800', fontSize: 15 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '800', marginBottom: 10 },
  langRow: { marginBottom: 8 },
  body: { fontSize: 14, lineHeight: 21, marginTop: 4 },
  hRow: { gap: 12, paddingRight: 16 },
  castCard: { width: 92 },
  castImg: { width: 92, height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  castName: { fontSize: 13, fontWeight: '700' },
  castChar: { fontSize: 12 },
  trailer: { borderRadius: 12, overflow: 'hidden' },
  provider: { width: 72, alignItems: 'center', gap: 6 },
  providerLogo: { width: 56, height: 56, borderRadius: 14, overflow: 'hidden' },
  providerName: { fontSize: 11, textAlign: 'center' },
  recCard: { width: 110 },
  recPoster: { width: 110, height: 165, borderRadius: 10, overflow: 'hidden', marginBottom: 6 },
  recTitle: { fontSize: 12, fontWeight: '600' },
});
