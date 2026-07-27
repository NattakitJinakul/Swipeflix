/**
 * EmptyState — icon + title + subtitle + optional action button. Pure/props-driven.
 * Used for empty decks, empty watchlist tabs, no search results. See docs/06-design-ui.md.
 */
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type EmptyStateProps = {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  icon = 'film-outline',
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  return (
    <View style={styles.root}>
      <View style={[styles.iconWrap, { backgroundColor: c.surface }]}>
        <Ionicons name={icon} size={44} color={c.muted} />
      </View>
      <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.muted }]}>{subtitle}</Text> : null}
      {actionLabel && onAction ? (
        <Pressable
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          onPress={onAction}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconWrap: {
    width: 92,
    height: 92,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 19, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  button: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
