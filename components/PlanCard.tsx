/**
 * PlanCard — subscription plan card (pricing screen). Pure/props-driven.
 * name, price, perks list, "แนะนำ" badge, selected state, onSelect.
 * Local prop shape (no src/utils import) to stay decoupled. See docs/02-screens.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

export type PlanCardData = {
  id: string;
  name: string;
  price: string;
  perks: string[];
  recommended?: boolean;
};

export type PlanCardProps = {
  plan: PlanCardData;
  selected: boolean;
  onSelect: (id: string) => void;
};

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const border = selected ? c.primary : 'transparent';

  return (
    <Pressable
      onPress={() => onSelect(plan.id)}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: c.surface, borderColor: border, opacity: pressed ? 0.9 : 1 },
      ]}
    >
      {plan.recommended ? (
        <View style={[styles.badge, { backgroundColor: c.primary }]}>
          <Text style={styles.badgeText}>{t('pricing.recommended')}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <Text style={[styles.name, { color: c.text }]}>{plan.name}</Text>
        <View
          style={[
            styles.radio,
            { borderColor: selected ? c.primary : c.muted },
            selected ? { backgroundColor: c.primary } : null,
          ]}
        >
          {selected ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
        </View>
      </View>

      <Text style={[styles.price, { color: c.primary }]}>{plan.price}</Text>

      <View style={styles.perks}>
        {plan.perks.map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Ionicons name="checkmark-circle" size={16} color={c.like} />
            <Text style={[styles.perkText, { color: c.text }]}>{perk}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 2,
    padding: 18,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { fontSize: 18, fontWeight: '800' },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  price: { fontSize: 24, fontWeight: '900' },
  perks: { gap: 8, marginTop: 4 },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  perkText: { fontSize: 14, fontWeight: '500', flex: 1 },
});
