/**
 * LangBadge — small pill shown when content fell back to English (no localized data).
 * Pure/props-driven. See docs/02-screens.md + docs/06-design-ui.md.
 */
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type LangBadgeProps = {
  /** Short pill text. */
  label?: string;
};

export function LangBadge({ label = '🌐 EN' }: LangBadgeProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  return (
    <View style={[styles.pill, { backgroundColor: c.surface, borderColor: c.muted }]}>
      <Text style={[styles.text, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  text: { fontSize: 12, fontWeight: '600' },
});
