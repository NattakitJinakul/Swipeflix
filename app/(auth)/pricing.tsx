import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlanCard, type PlanCardData } from '@/components/PlanCard';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { setPlan } from '@/src/firebase/subscription';
import { useAuth } from '@/src/store/auth';
import type { Plan } from '@/src/types/user';
import { PLANS } from '@/src/utils/plans';

const priceLabel = (price: number): string => (price === 0 ? 'ฟรี' : `฿${price}/เดือน`);

const CARDS: PlanCardData[] = PLANS.map((p) => ({
  id: p.id,
  name: p.name,
  price: priceLabel(p.price),
  perks: p.perks,
  recommended: p.recommended,
}));

export default function PricingScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const { user } = useAuth();

  const [selected, setSelected] = useState<string>('plus');
  const [busy, setBusy] = useState(false);

  const onContinue = async () => {
    setBusy(true);
    try {
      if (user) {
        // Mock purchase — just writes the plan doc. Ignore failures (placeholder env).
        await setPlan(user.uid, selected as Plan).catch(() => {});
      }
    } finally {
      setBusy(false);
      router.replace('/(auth)/onboarding');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: c.text }]}>เลือกแผนของคุณ</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            เริ่มฟรี อัปเกรดเมื่อไหร่ก็ได้
          </Text>
        </View>

        <View style={styles.cards}>
          {CARDS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={selected === plan.id}
              onSelect={setSelected}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: c.background }]}>
        <Pressable
          onPress={onContinue}
          disabled={busy}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: c.primary, opacity: busy || pressed ? 0.85 : 1 },
          ]}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaText}>ดำเนินการต่อ</Text>}
        </Pressable>
        <Text style={[styles.mockNote, { color: c.muted }]}>* การชำระเงินเป็นแบบจำลอง (mock)</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 20 },
  header: { gap: 6 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 15 },
  cards: { gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20, gap: 8 },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  mockNote: { fontSize: 12, textAlign: 'center' },
});
