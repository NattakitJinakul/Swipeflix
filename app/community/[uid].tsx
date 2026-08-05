/**
 * Community — a single player's public profile (avatar, name, liked count, taste chart).
 * Read-only, guest-viewable. getPublicProfile returns null on missing/unreachable data.
 */
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { gameImage } from '@/components/game-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getPublicProfile } from '@/src/firebase/profiles';
import { useT } from '@/src/i18n';
import type { PublicProfile } from '@/src/types/user';

const POSTER_W = (Dimensions.get('window').width - 16 * 2 - 10 * 2) / 3;

export default function CommunityProfileScreen() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    setLoading(true);
    getPublicProfile(uid)
      .then((p) => active && setProfile(p))
      .catch(() => active && setProfile(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uid]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <EmptyState icon="person-outline" title={t('community.notFound')} />
      </View>
    );
  }

  const topGenres = profile.topGenres.slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Avatar value={profile.avatar} name={profile.displayName} size={96} />
        <Text style={[styles.name, { color: c.text }]}>{profile.displayName || '—'}</Text>
        <Text style={[styles.meta, { color: c.muted }]}>
          {t('community.gamesLiked', { n: profile.likedCount })}
        </Text>
      </View>

      {profile.likedGames.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('community.likedTitle')}</Text>
          <View style={styles.grid}>
            {profile.likedGames.map((g) => {
              const uri = gameImage(g.image);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => router.push(`/game/${g.id}`)}
                  style={({ pressed }) => [styles.poster, { backgroundColor: c.surface, opacity: pressed ? 0.75 : 1 }]}
                >
                  {uri ? (
                    <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} cachePolicy="memory-disk" />
                  ) : (
                    <Text style={[styles.posterFallback, { color: c.muted }]} numberOfLines={3}>{g.name}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {topGenres.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>{t('community.tasteTitle')}</Text>
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            {topGenres.map((g) => (
              <View key={g.name} style={styles.barRow}>
                <Text style={[styles.barLabel, { color: c.text }]} numberOfLines={1}>
                  {g.name}
                </Text>
                <View style={[styles.barTrack, { backgroundColor: c.background }]}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${Math.max(g.percent, 4)}%`, backgroundColor: c.primary },
                    ]}
                  />
                </View>
                <Text style={[styles.barPct, { color: c.muted }]}>{g.percent}%</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {profile.favoriteGenres.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.chips}>
            {profile.favoriteGenres.map((g) => (
              <View key={g} style={[styles.chip, { backgroundColor: c.surface }]}>
                <Text style={[styles.chipText, { color: c.text }]}>{g}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 20 },
  header: { alignItems: 'center', gap: 8, marginTop: 8 },
  name: { fontSize: 22, fontWeight: '900' },
  meta: { fontSize: 14, fontWeight: '600' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  card: { borderRadius: 16, padding: 16, gap: 12 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 84, fontSize: 13, fontWeight: '700' },
  barTrack: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barPct: { width: 38, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  poster: {
    width: POSTER_W,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  posterFallback: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
