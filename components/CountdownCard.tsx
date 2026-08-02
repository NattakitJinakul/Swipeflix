/**
 * CountdownCard — a cover-backed card for an anticipated game with a live D/H/M countdown to
 * release (flip-tile styled) over a dark gradient. Ticks every 60s. Tap -> detail.
 */
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { gameImage } from '@/components/game-image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';
import type { UpcomingGame } from '@/src/types/game';

function calc(epochSec: number) {
  const totalMin = Math.max(0, Math.floor((epochSec * 1000 - Date.now()) / 60000));
  return {
    days: Math.floor(totalMin / (60 * 24)),
    hours: Math.floor((totalMin % (60 * 24)) / 60),
    minutes: totalMin % 60,
  };
}
const pad = (n: number) => String(n).padStart(2, '0');

export function CountdownCard({ game, onPress }: { game: UpcomingGame; onPress: () => void }) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const [cd, setCd] = useState(() => calc(game.releaseEpoch));

  useEffect(() => {
    const id = setInterval(() => setCd(calc(game.releaseEpoch)), 60000);
    return () => clearInterval(id);
  }, [game.releaseEpoch]);

  const uri = gameImage(game.image);
  const date = new Date(game.releaseEpoch * 1000).toLocaleDateString();

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: c.surface }]} />
      )}
      <LinearGradient colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.92)']} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={styles.body}>
        <View style={styles.tiles}>
          <Tile n={cd.days} label={t('discover.days')} accent={c.primary} />
          <Tile n={cd.hours} label={t('discover.hours')} accent={c.primary} />
          <Tile n={cd.minutes} label={t('discover.minutes')} accent={c.primary} />
        </View>
        <Text numberOfLines={2} style={styles.name}>{game.name}</Text>
        <Text numberOfLines={1} style={styles.date}>{t('discover.releasesOn', { date })}</Text>
      </View>
    </Pressable>
  );
}

function Tile({ n, label, accent }: { n: number; label: string; accent: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.tileNum, { color: accent }]}>{pad(n)}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#000',
  },
  body: { padding: 12, gap: 6 },
  tiles: { flexDirection: 'row', gap: 5 },
  tile: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
    paddingVertical: 5,
  },
  tileNum: { fontSize: 17, fontWeight: '900' },
  tileLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  name: { color: '#fff', fontSize: 15, fontWeight: '800' },
  date: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: '600' },
});
