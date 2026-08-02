import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT, type TFunc } from '@/src/i18n';
import { useAuth } from '@/src/store/auth';

function errMsg(e: unknown, t: TFunc): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('invalid-credential') || code.includes('wrong-password'))
    return t('auth.errInvalidCredential');
  if (code.includes('user-not-found')) return t('auth.errUserNotFound');
  if (code.includes('invalid-email')) return t('auth.errInvalidEmail');
  if (code.includes('network')) return t('auth.errNetwork');
  return e instanceof Error ? e.message : t('auth.errSignInFailed');
}

export default function LoginScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setError(null);
    if (!email || !password) {
      setError(t('auth.errFillEmailPassword'));
      return;
    }
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      // Root gate handles navigation on success.
    } catch (e) {
      setError(errMsg(e, t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <Pressable style={styles.container} onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.brand}>
            <Text style={[styles.logo, { color: c.primary }]}>SWIPEPLAY</Text>
            <Text style={[styles.tagline, { color: c.muted }]}>{t('auth.tagline')}</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.title, { color: c.text }]}>{t('auth.signInTitle')}</Text>

            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
              placeholder={t('auth.email')}
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
              placeholder={t('auth.password')}
              placeholderTextColor={c.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={[styles.error, { color: c.dislike }]}>{error}</Text> : null}

            <Pressable
              onPress={onSignIn}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: c.primary, opacity: busy || pressed ? 0.8 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t('auth.signInTitle')}</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: c.muted }]} />
              <Text style={[styles.or, { color: c.muted }]}>{t('common.or')}</Text>
              <View style={[styles.line, { backgroundColor: c.muted }]} />
            </View>

            <GoogleAuthButton
              label={t('auth.googleSignIn')}
              disabled={busy}
              onBusy={setBusy}
              onError={(m) => setError(m || null)}
            />

            <Pressable hitSlop={8} onPress={() => router.replace('/(tabs)')} style={styles.guestBtn}>
              <Text style={[styles.guestText, { color: c.muted }]}>{t('auth.continueGuest')}</Text>
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={{ color: c.muted }}>{t('auth.noAccount')}</Text>
            <Link href="/(auth)/signup" style={[styles.link, { color: c.primary }]}>
              {t('auth.signUpLink')}
            </Link>
          </View>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flex: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 40 },
  brand: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 34, fontWeight: '900', letterSpacing: 2 },
  tagline: { fontSize: 14 },
  form: { gap: 14 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  error: { fontSize: 13 },
  primaryBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, opacity: 0.4 },
  or: { fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  link: { fontWeight: '800' },
  guestBtn: { alignItems: 'center', paddingVertical: 10, marginTop: 2 },
  guestText: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
});
