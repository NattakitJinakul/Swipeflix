/**
 * SignInPrompt — themed modal card shown when a guest tries to save (like / played).
 * Replaces the native Alert with a rounded surface card: icon, title, message, primary "Sign in",
 * and a secondary "Not now". Dark + light friendly. Guest-first — closing keeps browsing.
 */
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

export type SignInPromptProps = {
  visible: boolean;
  onClose: () => void;
  onSignIn: () => void;
};

export function SignInPrompt({ visible, onClose, onSignIn }: SignInPromptProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Inner pressable swallows taps so tapping the card doesn't dismiss. */}
        <Pressable style={[styles.card, { backgroundColor: c.surface }]} onPress={() => {}}>
          <View style={[styles.iconCircle, { backgroundColor: c.like }]}>
            <Ionicons name="heart" size={30} color="#fff" />
          </View>
          <Text style={[styles.title, { color: c.text }]}>{t('signin.title')}</Text>
          <Text style={[styles.body, { color: c.muted }]}>{t('signin.body')}</Text>

          <Pressable
            onPress={onSignIn}
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={styles.primaryText}>{t('signin.cta')}</Text>
          </Pressable>

          <Pressable hitSlop={8} onPress={onClose} style={styles.secondaryBtn}>
            <Text style={[styles.secondaryText, { color: c.muted }]}>{t('signin.notNow')}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 20, textAlign: 'center' },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    height: 50,
    borderRadius: 14,
    marginTop: 10,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { paddingVertical: 10 },
  secondaryText: { fontSize: 15, fontWeight: '700' },
});
