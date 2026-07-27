/**
 * StatBadge — number + label stat tile (profile: liked / watched counts). Pure/props-driven.
 * See docs/02-screens.md (Profile).
 */
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type StatBadgeProps = {
  value: number | string;
  label: string;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  /** Accent color for icon + value (defaults to brand primary). */
  color?: string;
};

export function StatBadge({ value, label, icon, color }: StatBadgeProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const accent = color ?? c.primary;

  return (
    <View style={[styles.tile, { backgroundColor: c.surface }]}>
      {icon ? <Ionicons name={icon} size={20} color={accent} style={styles.icon} /> : null}
      <Text style={[styles.value, { color: accent }]}>{value}</Text>
      <Text style={[styles.label, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  icon: { marginBottom: 2 },
  value: { fontSize: 26, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '600' },
});
