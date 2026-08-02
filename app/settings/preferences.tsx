/**
 * Preferences — theme / language / region / favorite genres. All wired to the settings store
 * (real, persisted). The language toggle sets 'en' | 'th', which drives app-wide i18n.
 */
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { GenreChip } from '@/components/GenreChip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';
import { useSettings } from '@/src/store/settings';
import type { ThemePref } from '@/src/types/user';
import { CATEGORIES, categoryLabel } from '@/src/utils/genres';

type Colorset = (typeof Colors)['dark'];

export default function PreferencesScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();

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

  const themeOpts: { value: ThemePref; label: string }[] = [
    { value: 'dark', label: t('prefs.themeDark') },
    { value: 'light', label: t('prefs.themeLight') },
    { value: 'system', label: t('prefs.themeSystem') },
  ];
  const langOpts = [
    { value: 'th', label: t('onboarding.langThai') },
    { value: 'en', label: t('onboarding.langEnglish') },
  ];
  const regionOpts = [
    { value: 'TH', label: t('prefs.regionTH') },
    { value: 'US', label: t('prefs.regionUS') },
  ];

  const toggleGenre = (slug: string) => {
    setFavoriteGenres(
      favoriteGenres.includes(slug)
        ? favoriteGenres.filter((g) => g !== slug)
        : [...favoriteGenres, slug],
    );
  };

  return (
    <ScrollView style={{ backgroundColor: c.background }} contentContainerStyle={styles.content}>
      <Row label={t('prefs.theme')} color={c.muted}>
        <Segmented c={c} value={theme} options={themeOpts} onChange={setTheme} />
      </Row>

      <Row label={t('prefs.language')} color={c.muted}>
        <Segmented c={c} value={language} options={langOpts} onChange={setLanguage} />
      </Row>

      <Row label={t('prefs.region')} color={c.muted}>
        <Segmented c={c} value={region} options={regionOpts} onChange={setRegion} />
      </Row>

      {/* Favorite genres */}
      <View style={styles.genreSection}>
        <Text style={[styles.rowLabel, { color: c.muted }]}>{t('prefs.genres')}</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((slug) => (
            <GenreChip
              key={slug}
              label={categoryLabel(slug)}
              selected={favoriteGenres.includes(slug)}
              onToggle={() => toggleGenre(slug)}
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
  genreSection: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
});
