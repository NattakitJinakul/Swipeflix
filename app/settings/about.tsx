/**
 * About — app version, REQUIRED IGDB attribution, Privacy/Terms links (mock).
 * IGDB credit line is mandatory (game data provided by IGDB.com, powered by Twitch).
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
          <Ionicons name="game-controller" size={34} color="#fff" />
        </View>
        <Text style={[styles.appName, { color: c.text }]}>Swipeplay</Text>
        <Text style={[styles.version, { color: c.muted }]}>เวอร์ชัน {APP_VERSION}</Text>
      </View>

      {/* IGDB attribution — REQUIRED */}
      <View style={[styles.igdbCard, { backgroundColor: c.surface }]}>
        <Text style={[styles.igdbLogo, { color: '#9147FF' }]}>IGDB</Text>
        <Text style={[styles.igdbText, { color: c.text }]}>
          This product uses the IGDB API. Game data is provided by IGDB.com (powered by Twitch).
        </Text>
        <Text style={[styles.igdbNote, { color: c.muted }]}>
          ข้อมูลเกม รูปปก และเรตติ้งทั้งหมดจาก IGDB.com
        </Text>
        <Pressable
          onPress={() => open('https://www.igdb.com/')}
          style={({ pressed }) => [styles.igdbLink, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.igdbLinkText, { color: c.primary }]}>igdb.com</Text>
          <Ionicons name="open-outline" size={14} color={c.primary} />
        </Pressable>
      </View>

      {/* Legal links */}
      <View style={styles.list}>
        <LinkRow c={c} icon="shield-checkmark-outline" label="นโยบายความเป็นส่วนตัว" onPress={() => open('https://example.com/privacy')} />
        <LinkRow c={c} icon="document-text-outline" label="ข้อกำหนดการใช้งาน" onPress={() => open('https://example.com/terms')} last />
      </View>

      <Text style={[styles.copyright, { color: c.muted }]}>© 2026 Swipeplay</Text>
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
  igdbCard: { borderRadius: 16, padding: 18, gap: 10 },
  igdbLogo: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  igdbText: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  igdbNote: { fontSize: 13, lineHeight: 19 },
  igdbLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  igdbLinkText: { fontSize: 14, fontWeight: '700' },
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
