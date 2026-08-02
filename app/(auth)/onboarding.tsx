import { router } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GenreChip } from '@/components/GenreChip';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { db } from '@/src/firebase/config';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/store/auth';
import { useSettings } from '@/src/store/settings';
import { CATEGORIES, categoryLabel } from '@/src/utils/genres';

const LANGS = [
  { key: 'th-TH', labelKey: 'onboarding.langThai' },
  { key: 'en-US', labelKey: 'onboarding.langEnglish' },
];
const REGIONS = [
  { key: 'TH', labelKey: 'onboarding.regionThailand' },
  { key: 'US', labelKey: 'onboarding.regionUS' },
];
const MIN_GENRES = 3;
const MAX_GENRES = 5;

export default function OnboardingScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const { user } = useAuth();
  const { setLanguage, setRegion, setFavoriteGenres } = useSettings();

  const [step, setStep] = useState<0 | 1>(0);
  const [lang, setLang] = useState('en-US'); // English is the app default
  const [region, setReg] = useState('TH');
  const [genres, setGenres] = useState<string[]>([]);

  const toggleGenre = (slug: string) => {
    setGenres((prev) => {
      if (prev.includes(slug)) return prev.filter((g) => g !== slug);
      if (prev.length >= MAX_GENRES) return prev;
      return [...prev, slug];
    });
  };

  const goStep2 = () => {
    setLanguage(lang);
    setRegion(region);
    setStep(1);
  };

  const finish = () => {
    setFavoriteGenres(genres);
    if (user) {
      // Persist an explicit onboarded flag for cold starts. Best-effort.
      void updateDoc(doc(db, 'users', user.uid), { 'profile.onboarded': true }).catch(() => {});
    }
    // Guest-first gate no longer force-redirects out of onboarding, so navigate explicitly.
    router.replace('/(tabs)');
  };

  const Segment = ({
    options,
    value,
    onChange,
  }: {
    options: { key: string; labelKey: string }[];
    value: string;
    onChange: (k: string) => void;
  }) => (
    <View style={styles.segment}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            style={[
              styles.segItem,
              {
                backgroundColor: active ? c.primary : c.surface,
                borderColor: active ? c.primary : c.muted,
              },
            ]}
          >
            <Text style={[styles.segText, { color: active ? '#fff' : c.text }]}>{t(o.labelKey)}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <View style={styles.progressRow}>
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[styles.dot, { backgroundColor: i <= step ? c.primary : c.surface }]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]}>{t('onboarding.step1Title')}</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>{t('onboarding.step1Sub')}</Text>

          <Text style={[styles.label, { color: c.text }]}>{t('onboarding.langLabel')}</Text>
          <Segment options={LANGS} value={lang} onChange={setLang} />

          <Text style={[styles.label, { color: c.text }]}>{t('onboarding.regionLabel')}</Text>
          <Segment options={REGIONS} value={region} onChange={setReg} />

          <View style={styles.spacer} />
          <Pressable
            onPress={goStep2}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.ctaText}>{t('common.next')}</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={[styles.title, { color: c.text }]}>{t('onboarding.step2Title')}</Text>
          <Text style={[styles.subtitle, { color: c.muted }]}>
            {t('onboarding.step2Sub', { min: MIN_GENRES, max: MAX_GENRES, count: genres.length })}
          </Text>

          <ScrollView style={styles.flex} contentContainerStyle={styles.chipWrap}>
            {CATEGORIES.map((slug) => (
              <GenreChip
                key={slug}
                label={categoryLabel(slug)}
                selected={genres.includes(slug)}
                onToggle={() => toggleGenre(slug)}
              />
            ))}
          </ScrollView>

          <Pressable
            onPress={finish}
            disabled={genres.length < MIN_GENRES}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: c.primary,
                opacity: genres.length < MIN_GENRES ? 0.4 : pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.ctaText}>{t('onboarding.start')}</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingTop: 12 },
  dot: { flex: 1, height: 4, borderRadius: 2 },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 28, gap: 14 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 15, marginBottom: 8 },
  label: { fontSize: 15, fontWeight: '700', marginTop: 8 },
  segment: { flexDirection: 'row', gap: 12 },
  segItem: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    alignItems: 'center',
  },
  segText: { fontSize: 15, fontWeight: '700' },
  spacer: { flex: 1 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingVertical: 8 },
  cta: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginBottom: 16 },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
