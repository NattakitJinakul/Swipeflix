/**
 * Preferences — theme / language / region / favorite genres + accessibility & content toggles.
 * Wired to useSettings where the store has a field; extras kept in local state (TODO: persist).
 * See docs/10-profile-settings.md + docs/11-enhancements.md (Settings — เสริม).
 */
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { GenreChip } from '@/components/GenreChip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSettings } from '@/src/store';
import type { ThemePref } from '@/src/types/user';
import { GENRE_MAP } from '@/src/utils/genres';

type Colorset = (typeof Colors)['dark'];

const THEME_OPTS: { value: ThemePref; label: string }[] = [
  { value: 'dark', label: 'มืด' },
  { value: 'light', label: 'สว่าง' },
  { value: 'system', label: 'ระบบ' },
];
const LANG_OPTS = [
  { value: 'th-TH', label: 'ไทย' },
  { value: 'en-US', label: 'English' },
];
const REGION_OPTS = [
  { value: 'TH', label: 'ไทย' },
  { value: 'US', label: 'สหรัฐฯ' },
];
const SENSITIVITY_OPTS = [
  { value: 'low', label: 'ต่ำ' },
  { value: 'medium', label: 'กลาง' },
  { value: 'high', label: 'สูง' },
];

const GENRE_ENTRIES = Object.entries(GENRE_MAP).map(([id, name]) => ({ id: Number(id), name }));

export default function PreferencesScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];

  const {
    theme,
    language,
    region,
    favoriteGenres,
    setTheme,
    setLanguage,
    setRegion,
    setFavoriteGenres,
  } = useSettings();

  // Extras not yet in the settings store — local only (TODO: add store fields + persist).
  const [autoplay, setAutoplay] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sensitivity, setSensitivity] = useState('medium');
  const [hideAdult, setHideAdult] = useState(true);

  const toggleGenre = (id: number) => {
    setFavoriteGenres(
      favoriteGenres.includes(id)
        ? favoriteGenres.filter((g) => g !== id)
        : [...favoriteGenres, id],
    );
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Row label="ธีม" color={c.muted}>
        <Segmented c={c} value={theme} options={THEME_OPTS} onChange={setTheme} />
      </Row>

      <Row label="ภาษา" color={c.muted}>
        <Segmented c={c} value={language} options={LANG_OPTS} onChange={setLanguage} />
      </Row>

      <Row label="ภูมิภาค" color={c.muted}>
        <Segmented c={c} value={region} options={REGION_OPTS} onChange={setRegion} />
      </Row>

      <Row label="ความไวการปัด" color={c.muted}>
        <Segmented c={c} value={sensitivity} options={SENSITIVITY_OPTS} onChange={setSensitivity} />
      </Row>

      {/* Toggles */}
      <View style={[styles.toggleBox]}>
        <ToggleRow c={c} label="เล่นตัวอย่างอัตโนมัติ" value={autoplay} onChange={setAutoplay} />
        <ToggleRow c={c} label="ลดการเคลื่อนไหว (ใช้ปุ่มแทนการปัด)" value={reduceMotion} onChange={setReduceMotion} />
        <ToggleRow c={c} label="ซ่อนเนื้อหาผู้ใหญ่" value={hideAdult} onChange={setHideAdult} last />
      </View>

      {/* Favorite genres */}
      <View style={styles.genreSection}>
        <Text style={[styles.rowLabel, { color: c.muted }]}>แนวหนังที่ชอบ</Text>
        <View style={styles.chips}>
          {GENRE_ENTRIES.map((g) => (
            <GenreChip
              key={g.id}
              label={g.name}
              selected={favoriteGenres.includes(g.id)}
              onToggle={() => toggleGenre(g.id)}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color }]}>{label}</Text>
      {children}
    </View>
  );
}

function Segmented<T extends string>({
  c,
  value,
  options,
  onChange,
}: {
  c: Colorset;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={[styles.segment, { backgroundColor: c.surface }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Text
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[
              styles.segmentItem,
              { color: active ? '#fff' : c.text },
              active && { backgroundColor: c.primary },
            ]}
          >
            {o.label}
          </Text>
        );
      })}
    </View>
  );
}

function ToggleRow({
  c,
  label,
  value,
  onChange,
  last,
}: {
  c: Colorset;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.toggleRow,
        { backgroundColor: c.surface },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.background },
      ]}
    >
      <Text style={[styles.toggleLabel, { color: c.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: c.muted }} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 18 },
  row: { gap: 8 },
  rowLabel: { fontSize: 14, fontWeight: '700', paddingHorizontal: 4 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segmentItem: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 9,
    borderRadius: 9,
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
  },
  toggleBox: { borderRadius: 14, overflow: 'hidden' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
  genreSection: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
