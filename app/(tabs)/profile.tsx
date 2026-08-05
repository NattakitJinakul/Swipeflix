/**
 * Profile tab — guest-first. Guests see a friendly state + Sign in CTA. Signed-in users get an
 * editable avatar + editable display name + email, stat cards (liked / played / avg rating),
 * a taste chart (top genres), Game DNA (favorite decade + achievement badges), and links to
 * Community + Settings. A compact public summary is mirrored to Firestore on mount.
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TAB_BAR_CLEARANCE } from '@/components/AnimatedTabBar';
import { Avatar } from '@/components/Avatar';
import { EmptyState } from '@/components/EmptyState';
import { StatBadge } from '@/components/StatBadge';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { writePublicProfile } from '@/src/firebase/profiles';
import { useT } from '@/src/i18n';
import { useAuth, useLibrary } from '@/src/store';
import { computeDNA } from '@/src/utils/dna';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function ProfileScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = useT();

  const { user, profile, isGuest, updateProfile } = useAuth();
  const { liked, played } = useLibrary();

  const dna = useMemo(() => computeDNA(liked, played), [liked, played]);
  const avgRating = useMemo(() => {
    const rated = liked.filter((g) => g.rating != null);
    if (!rated.length) return 0;
    return Math.round(rated.reduce((a, g) => a + (g.rating ?? 0), 0) / rated.length);
  }, [liked]);

  const displayName = profile?.displayName || user?.displayName || t('profile.fallbackName');
  const topGenres = dna.topGenres.slice(0, 5);

  // Mirror a compact public summary to Firestore for the Community feature (best-effort).
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    writePublicProfile(uid, {
      displayName,
      avatar: profile?.avatar ?? null,
      favoriteGenres: profile?.favoriteGenres ?? [],
      likedCount: liked.length,
      topGenres: topGenres.map((g) => ({ name: g.name, percent: g.percent })),
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, liked.length, displayName, profile?.avatar]);

  // ---- Name edit modal ----
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const openNameEdit = () => {
    setNameDraft(displayName);
    setEditingName(true);
  };
  const saveName = () => {
    const next = nameDraft.trim();
    setEditingName(false);
    if (next && next !== displayName) void updateProfile({ displayName: next }).catch(() => {});
  };

  const statRow = (
    <View style={styles.statRow}>
      <StatBadge value={liked.length} label={t('profile.statLiked')} icon="heart" color={c.like} />
      <StatBadge value={played.length} label={t('profile.statPlayed')} icon="game-controller" color={c.watched} />
      <StatBadge value={avgRating > 0 ? avgRating : '—'} label={t('profile.statAvg')} icon="star" />
    </View>
  );

  // ---- Guest state ----
  if (isGuest) {
    return (
      <ScrollView
        style={{ backgroundColor: c.background }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
      >
        <View style={styles.header}>
          <Avatar value={null} size={96} />
          <Text style={[styles.name, { color: c.text }]}>{t('profile.guestTitle')}</Text>
          <Text style={[styles.guestSub, { color: c.muted }]}>{t('profile.guestSub')}</Text>
          <Pressable
            onPress={() => router.push('/(auth)/login')}
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.loginBtnText}>{t('common.signIn')}</Text>
          </Pressable>
        </View>

        {statRow}
      </ScrollView>
    );
  }

  // ---- Signed-in state ----
  const hasData = liked.length > 0 || played.length > 0;

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Avatar
          value={profile?.avatar ?? null}
          name={displayName}
          size={96}
          editable
          uploadUid={user?.uid}
          onChange={(url) => void updateProfile({ avatar: url }).catch(() => {})}
        />
        <Pressable onPress={openNameEdit} style={({ pressed }) => [styles.nameRow, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.name, { color: c.text }]}>{displayName}</Text>
          <Ionicons name="pencil" size={16} color={c.muted} />
        </Pressable>
        <Text style={[styles.email, { color: c.muted }]}>{profile?.email ?? user?.email ?? ''}</Text>

        <View style={styles.actionRow}>
          <Pressable
            onPress={() => router.push('/community')}
            style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="people" size={16} color="#fff" />
            <Text style={styles.actionBtnText}>{t('profile.community')}</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/settings')}
            style={({ pressed }) => [styles.actionBtnOutline, { borderColor: c.muted, opacity: pressed ? 0.7 : 1 }]}
          >
            <Ionicons name="settings-outline" size={16} color={c.text} />
            <Text style={[styles.actionBtnOutlineText, { color: c.text }]}>{t('profile.settings')}</Text>
          </Pressable>
        </View>
      </View>

      {statRow}

      {!hasData ? (
        <View style={styles.emptyWrap}>
          <EmptyState
            icon="sparkles-outline"
            title={t('profile.emptyTitle')}
            subtitle={t('profile.emptySub')}
            actionLabel={t('profile.emptyCta')}
            onAction={() => router.push('/(tabs)')}
          />
        </View>
      ) : (
        <>
          {/* Taste chart */}
          {topGenres.length > 0 ? (
            <Section title={t('profile.tasteTitle')} color={c.text}>
              <View style={[styles.card, { backgroundColor: c.surface }]}>
                {topGenres.map((g) => (
                  <View key={g.name} style={styles.barRow}>
                    <Text style={[styles.barLabel, { color: c.text }]} numberOfLines={1}>
                      {g.name}
                    </Text>
                    <View style={[styles.barTrack, { backgroundColor: c.background }]}>
                      <View style={[styles.barFill, { width: `${Math.max(g.percent, 4)}%`, backgroundColor: c.primary }]} />
                    </View>
                    <Text style={[styles.barPct, { color: c.muted }]}>{g.percent}%</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}

          {/* Game DNA */}
          <Section title={t('profile.dnaTitle')} color={c.text}>
            {dna.favoriteDecade ? (
              <View style={[styles.card, styles.decadeCard, { backgroundColor: c.surface }]}>
                <Ionicons name="calendar" size={22} color={c.primary} />
                <View style={styles.decadeText}>
                  <Text style={[styles.decadeLabel, { color: c.text }]}>
                    {t('profile.favoriteDecade')} · {dna.favoriteDecade.label}
                  </Text>
                  <Text style={[styles.decadeSub, { color: c.muted }]}>
                    {t('profile.decadeSub', { percent: dna.favoriteDecade.percent })}
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

      {/* Edit name modal */}
      <Modal visible={editingName} transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setEditingName(false)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{t('profile.editNameTitle')}</Text>
            <TextInput
              value={nameDraft}
              onChangeText={setNameDraft}
              autoFocus
              style={[styles.modalInput, { backgroundColor: c.background, color: c.text }]}
              placeholderTextColor={c.muted}
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setEditingName(false)} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: c.muted }]}>{t('common.cancel')}</Text>
              </Pressable>
              <Pressable onPress={saveName} style={[styles.modalBtn, styles.modalSave, { backgroundColor: c.primary }]}>
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>{t('common.save')}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 20 },
  header: { alignItems: 'center', gap: 8 },
  name: { fontSize: 22, fontWeight: '900' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  email: { fontSize: 13 },
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
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
  },
  actionBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  actionBtnOutlineText: { fontWeight: '700', fontSize: 14 },
  statRow: { flexDirection: 'row', gap: 12 },
  emptyWrap: { minHeight: 280 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  card: { borderRadius: 16, padding: 16, gap: 12 },
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
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 18, padding: 18, gap: 14 },
  modalTitle: { fontSize: 17, fontWeight: '800' },
  modalInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  modalBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  modalSave: {},
  modalBtnText: { fontWeight: '800', fontSize: 15 },
});
