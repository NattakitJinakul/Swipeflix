/**
 * Profile tab — guest-first. Guests see a friendly "โหมดผู้เยี่ยมชม" state with a login CTA
 * (plus any local liked/played counts). Signed-in users get avatar + plan badge, stat row
 * (liked/played/avg rating), taste chart (% per genre), Game DNA (favorite decade + badges),
 * and a button into Settings.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSubscription } from '@/src/firebase/subscription';
import { useAuth, useLibrary } from '@/src/store';
import type { Plan } from '@/src/types/user';
import { computeDNA } from '@/src/utils/dna';
import { getPlan } from '@/src/utils/plans';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { user, profile, isGuest } = useAuth();
  const { liked, played } = useLibrary();

  const [plan, setPlan] = useState<Plan>('free');

  // Load current plan (mock-safe: default free if no user / offline / no doc).
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setPlan('free');
      return;
    }
    let active = true;
    getSubscription(uid)
      .then((sub) => active && sub && setPlan(sub.plan))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const dna = useMemo(() => computeDNA(liked, played), [liked, played]);
  const planDef = getPlan(plan);

  const statRow = (
    <View style={styles.statRow}>
      <StatBadge value={liked.length} label="อยากเล่น" icon="heart" color={c.like} />
      <StatBadge value={played.length} label="เล่นแล้ว" icon="game-controller" color={c.watched} />
      <StatBadge
        value={dna.topGenres.length}
        label="แนวที่ชอบ"
        icon="grid"
      />
    </View>
  );

  // ---- Guest state ----
  if (isGuest) {
    return (
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
      >
        <View style={styles.header}>
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.surface }]}>
            <Ionicons name="person-outline" size={40} color={c.muted} />
          </View>
          <Text style={[styles.name, { color: c.text }]}>โหมดผู้เยี่ยมชม</Text>
          <Text style={[styles.guestSub, { color: c.muted }]}>
            เข้าสู่ระบบเพื่อบันทึกเกมที่ชอบ + ดูสถิติ
          </Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [
              styles.loginBtn,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>เข้าสู่ระบบ</Text>
          </Pressable>
        </View>

        {statRow}
      </ScrollView>
    );
  }

  // ---- Signed-in state ----
  const displayName = profile?.displayName || user?.displayName || 'ผู้เล่น';
  const avatar = profile?.avatar ?? user?.photoURL ?? null;
  const initial = displayName.trim().charAt(0).toUpperCase() || '?';
  const hasData = liked.length > 0 || played.length > 0;
  const topGenres = dna.topGenres.slice(0, 5);

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Text style={[styles.name, { color: c.text }]}>{displayName}</Text>
        <View style={[styles.planBadge, { backgroundColor: c.primary }]}>
          <Ionicons name="star" size={13} color="#fff" />
          <Text style={styles.planText}>{planDef.name}</Text>
        </View>

        <Pressable
          onPress={() => router.push('/settings')}
          style={({ pressed }) => [
            styles.settingsBtn,
            { borderColor: c.muted, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Ionicons name="settings-outline" size={16} color={c.text} />
          <Text style={[styles.settingsBtnText, { color: c.text }]}>ตั้งค่า</Text>
        </Pressable>
      </View>

      {statRow}

      {!hasData ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="sparkles-outline"
            title="ยังไม่มีข้อมูลรสนิยม"
            subtitle="ปัดเกมที่ชอบเพื่อปลดล็อก taste chart และ Game DNA ของคุณ"
            actionLabel="เริ่มปัดเกม"
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      ) : (
        <>
          {/* Taste chart */}
          {topGenres.length > 0 ? (
            <Section title="แนวที่ชอบ" color={c.text}>
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
            </Section>
          ) : null}

          {/* Game DNA */}
          <Section title="Game DNA" color={c.text}>
            {dna.favoriteDecade ? (
              <View style={[styles.card, styles.decadeCard, { backgroundColor: c.surface }]}>
                <Ionicons name="calendar" size={22} color={c.primary} />
                <View style={styles.decadeText}>
                  <Text style={[styles.decadeLabel, { color: c.text }]}>
                    ทศวรรษที่ชอบ · {dna.favoriteDecade.label}
                  </Text>
                  <Text style={[styles.decadeSub, { color: c.muted }]}>
                    {dna.favoriteDecade.percent}% ของเกมที่คุณถูกใจ
                  </Text>
                </View>
              </View>
            ) : null}

            <View style={styles.badgeGrid}>
              {dna.badges.map((b) => (
                <View
                  key={b.id}
                  style={[
                    styles.badge,
                    {
                      backgroundColor: c.surface,
                      opacity: b.earned ? 1 : 0.55,
                      borderColor: b.earned ? c.primary : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name={(b.earned ? b.icon : `${b.icon}-outline`) as IoniconName}
                    size={22}
                    color={b.earned ? c.primary : c.muted}
                  />
                  <Text style={[styles.badgeLabel, { color: c.text }]} numberOfLines={2}>
                    {b.label}
                  </Text>
                  {!b.earned && b.hint ? (
                    <Text style={[styles.badgeHint, { color: c.muted }]} numberOfLines={1}>
                      {b.hint}
                    </Text>
                  ) : null}
                </View>
              ))}
            </View>
          </Section>
        </>
      )}
    </ScrollView>
  );
}

function Section({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 20 },
  header: { alignItems: 'center', gap: 8 },
  avatar: { width: 88, height: 88, borderRadius: 999 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 36, fontWeight: '900' },
  name: { fontSize: 22, fontWeight: '900' },
  guestSub: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24 },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 999,
  },
  loginBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  planText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  settingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  settingsBtnText: { fontWeight: '700', fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 12 },
  emptyWrap: { minHeight: 280 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barLabel: { width: 84, fontSize: 13, fontWeight: '700' },
  barTrack: { flex: 1, height: 10, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  barPct: { width: 38, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  decadeCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  decadeText: { flex: 1, gap: 2 },
  decadeLabel: { fontSize: 15, fontWeight: '800' },
  decadeSub: { fontSize: 13 },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '31%',
    minWidth: 96,
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  badgeLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  badgeHint: { fontSize: 10, fontWeight: '600' },
});
