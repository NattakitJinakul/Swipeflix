/**
 * GenreChip — selectable chip (onboarding taste picker + swipe filter). Pure/props-driven.
 * See docs/02-screens.md + docs/06-design-ui.md.
 */
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type GenreChipProps = {
  label: string;
  selected: boolean;
  onToggle: () => void;
};

export function GenreChip({ label, selected, onToggle }: GenreChipProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.primary : c.surface,
          borderColor: selected ? c.primary : c.muted,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.text, { color: selected ? '#fff' : c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  text: { fontSize: 14, fontWeight: '700' },
});
