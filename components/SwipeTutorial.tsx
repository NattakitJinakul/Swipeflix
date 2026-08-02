/**
 * SwipeTutorial — first-run coach-mark overlay for the Swipe screen. A dark scrim dims the whole
 * screen; each step draws a glowing, gently pulsing rounded "spotlight" frame over a screen region
 * plus a caption card (title + body) with Skip / progress dots / Next (Got it on the last step).
 * Regions are approximated by screen fractions (no element measurement needed). Guest-friendly.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

/** AsyncStorage flag key for the swipe tutorial (bump the vN to re-show for everyone). */
export const TUTORIAL_KEY = 'swipeplay.tutorial.v1';

const { width: W, height: H } = Dimensions.get('window');

type Region = { top: number; left: number; width: number; height: number };
type Step = { titleKey: string; bodyKey: string; region: Region; captionTop: number };

// Approximate on-screen regions by fraction of the window (good enough for coach marks).
const STEPS: Step[] = [
  {
    titleKey: 'tutorial.deckTitle',
    bodyKey: 'tutorial.deckBody',
    region: { top: H * 0.2, left: 14, width: W - 28, height: H * 0.44 },
    captionTop: H * 0.2 + H * 0.44 + 16,
  },
  {
    titleKey: 'tutorial.buttonsTitle',
    bodyKey: 'tutorial.buttonsBody',
    region: { top: H * 0.78, left: 12, width: W - 24, height: H * 0.1 },
    captionTop: H * 0.5,
  },
  {
    titleKey: 'tutorial.tabsTitle',
    bodyKey: 'tutorial.tabsBody',
    region: { top: H - 96, left: 24, width: W - 48, height: 66 },
    captionTop: H * 0.55,
  },
];

export function SwipeTutorial({ onDone }: { onDone: () => void }) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const [i, setI] = useState(0);

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
  }, [pulse]);

  const frameStyle = useAnimatedStyle(() => ({
    opacity: 0.65 + 0.35 * pulse.value,
    transform: [{ scale: 1 + 0.015 * pulse.value }],
  }));

  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  const next = () => (last ? onDone() : setI((n) => n + 1));

  // Keep the caption card on screen (clamp its top).
  const captionTop = Math.min(step.captionTop, H - 260);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDone} statusBarTranslucent>
      <View style={styles.scrim}>
        {/* Spotlight frame */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.frame,
            frameStyle,
            {
              top: step.region.top,
              left: step.region.left,
              width: step.region.width,
              height: step.region.height,
              borderColor: c.primary,
              shadowColor: c.primary,
            },
          ]}
        />

        {/* Caption card */}
        <View style={[styles.card, { top: captionTop, backgroundColor: c.surface }]}>
          <Text style={[styles.title, { color: c.text }]}>{t(step.titleKey)}</Text>
          <Text style={[styles.body, { color: c.muted }]}>{t(step.bodyKey)}</Text>

          <View style={styles.controls}>
            <Pressable hitSlop={8} onPress={onDone}>
              <Text style={[styles.skip, { color: c.muted }]}>{t('tutorial.skip')}</Text>
            </Pressable>

            <View style={styles.dots}>
              {STEPS.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.dot,
                    { backgroundColor: idx === i ? c.primary : c.muted, width: idx === i ? 18 : 6 },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={next}
              style={({ pressed }) => [styles.nextBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={styles.nextText}>{last ? t('tutorial.gotIt') : t('common.next')}</Text>
              {!last ? <Ionicons name="arrow-forward" size={16} color="#fff" /> : null}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.82)' },
  frame: {
    position: 'absolute',
    borderRadius: 24,
    borderWidth: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 14,
  },
  title: { fontSize: 19, fontWeight: '900' },
  body: { fontSize: 14, lineHeight: 20 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  skip: { fontSize: 14, fontWeight: '700' },
  dots: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { height: 6, borderRadius: 3 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  nextText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
