/**
 * Subscription settings — current plan + renew date, upgrade (mock), payment history (mock).
 * See docs/10-profile-settings.md (สมาชิก).
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getSubscription } from '@/src/firebase/subscription';
import { useAuth } from '@/src/store';
import type { Subscription } from '@/src/types/user';
import { getPlan, PLANS } from '@/src/utils/plans';

const STATUS_LABEL: Record<Subscription['status'], string> = {
  active: 'ใช้งานอยู่',
  canceled: 'ยกเลิกแล้ว',
  past_due: 'ค้างชำระ',
  trialing: 'ทดลองใช้',
};

// Mock payment history — replace with real gateway records later.
const MOCK_HISTORY = [
  { id: '1', date: '01/07/2026', amount: 59, method: 'Visa •••• 4242' },
  { id: '2', date: '01/06/2026', amount: 59, method: 'Visa •••• 4242' },
  { id: '3', date: '01/05/2026', amount: 59, method: 'Visa •••• 4242' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function SubscriptionScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const { user } = useAuth();

  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setSub({ plan: 'free', renewsAt: null, status: 'active' });
      setLoading(false);
      return;
    }
    let active = true;
    getSubscription(uid)
      .then((s) => {
        if (active) setSub(s ?? { plan: 'free', renewsAt: null, status: 'active' });
      })
      .catch(() => active && setSub({ plan: 'free', renewsAt: null, status: 'active' }))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [user?.uid]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  const plan = sub?.plan ?? 'free';
  const planDef = getPlan(plan);
  const isPaid = plan !== 'free';

  const upgradeTargets = PLANS.filter((p) => p.id !== plan);

  const doUpgrade = (targetName: string) => {
    // TODO: link to pricing / trigger mock setPlan purchase flow.
    Alert.alert('อัปเกรดแผน', `จำลองการอัปเกรดไปแผน ${targetName}`);
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      {/* Current plan */}
      <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.primary }]}>
        <View style={styles.heroTop}>
          <Ionicons name="star" size={20} color={c.primary} />
          <Text style={[styles.heroPlan, { color: c.text }]}>แผน {planDef.name}</Text>
          <View style={[styles.statusPill, { backgroundColor: c.background }]}>
            <Text style={[styles.statusText, { color: c.muted }]}>
              {sub ? STATUS_LABEL[sub.status] : ''}
            </Text>
          </View>
        </View>
        <Text style={[styles.heroPrice, { color: c.primary }]}>
          {planDef.price === 0 ? 'ฟรี' : `฿${planDef.price}/เดือน`}
        </Text>
        <Text style={[styles.heroRenew, { color: c.muted }]}>
          {isPaid ? `ต่ออายุ: ${formatDate(sub?.renewsAt ?? null)}` : 'ไม่มีวันหมดอายุ'}
        </Text>
        <View style={styles.perks}>
          {planDef.perks.map((p) => (
            <View key={p} style={styles.perkRow}>
              <Ionicons name="checkmark-circle" size={16} color={c.like} />
              <Text style={[styles.perkText, { color: c.text }]}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Upgrade / manage */}
      {upgradeTargets.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.text }]}>เปลี่ยนแผน</Text>
          {upgradeTargets.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => doUpgrade(p.name)}
              style={({ pressed }) => [
                styles.upgradeRow,
                { backgroundColor: c.surface, opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.upgradeName, { color: c.text }]}>
                  {p.name}
                  {p.recommended ? '  ⭐ แนะนำ' : ''}
                </Text>
                <Text style={[styles.upgradeSub, { color: c.muted }]}>
                  {p.price === 0 ? 'ฟรี' : `฿${p.price}/เดือน`}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.muted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {/* Payment history */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>ประวัติการชำระเงิน</Text>
        <View style={styles.historyBox}>
          {isPaid ? (
            MOCK_HISTORY.map((h, i) => (
              <View
                key={h.id}
                style={[
                  styles.historyRow,
                  { backgroundColor: c.surface },
                  i < MOCK_HISTORY.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: c.background,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.historyDate, { color: c.text }]}>{h.date}</Text>
                  <Text style={[styles.historyMethod, { color: c.muted }]}>{h.method}</Text>
                </View>
                <Text style={[styles.historyAmount, { color: c.text }]}>฿{h.amount}</Text>
              </View>
            ))
          ) : (
            <View style={[styles.historyRow, { backgroundColor: c.surface }]}>
              <Text style={[styles.historyMethod, { color: c.muted }]}>ยังไม่มีประวัติการชำระเงิน</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 22 },
  hero: { borderRadius: 18, borderWidth: 1.5, padding: 18, gap: 6 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroPlan: { fontSize: 18, fontWeight: '900', flex: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, fontWeight: '700' },
  heroPrice: { fontSize: 26, fontWeight: '900' },
  heroRenew: { fontSize: 13, fontWeight: '600' },
  perks: { gap: 8, marginTop: 8 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 14, flex: 1 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  upgradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  upgradeName: { fontSize: 15, fontWeight: '800' },
  upgradeSub: { fontSize: 13, marginTop: 2 },
  historyBox: { borderRadius: 14, overflow: 'hidden' },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  historyDate: { fontSize: 14, fontWeight: '700' },
  historyMethod: { fontSize: 12, marginTop: 2 },
  historyAmount: { fontSize: 15, fontWeight: '800' },
});
