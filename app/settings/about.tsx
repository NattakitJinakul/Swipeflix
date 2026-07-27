/**
 * About — app version, REQUIRED TMDB attribution, Privacy/Terms links (mock).
 * TMDB credit line is mandatory per docs/04-tmdb-api.md.
 */
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Colorset = (typeof Colors)['dark'];

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function AboutScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  const open = (url: string) => {
    void WebBrowser.openBrowserAsync(url).catch(() => {});
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: c.primary }]}>
          <Ionicons name="film" size={34} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: c.text }]}>Swipeflix</Text>
        <Text style={[styles.version, { color: c.muted }]}>เวอร์ชัน {APP_VERSION}</Text>
      </View>

      {/* TMDB attribution — REQUIRED */}
      <View style={[styles.tmdbCard, { backgroundColor: c.surface }]}>
        <Text style={[styles.tmdbLogo, { color: '#01B4E4' }]}>TMDB</Text>
        <Text style={[styles.tmdbText, { color: c.text }]}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </Text>
        <Text style={[styles.tmdbNote, { color: c.muted }]}>
          ข้อมูลหนัง โปสเตอร์ และเรตติ้งทั้งหมดจาก The Movie Database (TMDB)
        </Text>
        <Pressable
          onPress={() => open('https://www.themoviedb.org/')}
          style={({ pressed }) => [styles.tmdbLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.tmdbLinkText, { color: c.primary }]}>themoviedb.org</Text>
          <Ionicons name="open-outline" size={14} color={c.primary} />
        </Pressable>
      </View>

      {/* Legal links */}
      <View style={styles.list}>
        <LinkRow c={c} icon="shield-checkmark-outline" label="นโยบายความเป็นส่วนตัว" onPress={() => open('https://example.com/privacy')} />
        <LinkRow c={c} icon="document-text-outline" label="ข้อกำหนดการใช้งาน" onPress={() => open('https://example.com/terms')} last />
      </View>

      <Text style={[styles.copyright, { color: c.muted }]}>© 2026 Swipeflix</Text>
    </ScrollView>
  );
}

function LinkRow({
  c,
  icon,
  label,
  onPress,
  last,
}: {
  c: Colorset;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.linkRow,
        { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.background },
      ]}
    >
      <Ionicons name={icon} size={20} color={c.primary} />
      <Text style={[styles.linkLabel, { color: c.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  hero: { alignItems: 'center', gap: 8, marginTop: 12 },
  logo: { width: 72, height: 72, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  appName: { fontSize: 24, fontWeight: '900' },
  version: { fontSize: 14, fontWeight: '600' },
  tmdbCard: { borderRadius: 16, padding: 18, gap: 10 },
  tmdbLogo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  tmdbText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  tmdbNote: { fontSize: 13, lineHeight: 19 },
  tmdbLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tmdbLinkText: { fontSize: 14, fontWeight: '700' },
  list: { borderRadius: 14, overflow: 'hidden' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  linkLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  copyright: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
