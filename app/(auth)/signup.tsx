import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleAuthButton } from '@/components/GoogleAuthButton';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/store/auth';

function errMsg(e: unknown): string {
  const code = (e as { code?: string })?.code ?? '';
  if (code.includes('email-already-in-use')) return 'อีเมลนี้ถูกใช้แล้ว';
  if (code.includes('weak-password')) return 'รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัว)';
  if (code.includes('invalid-email')) return 'อีเมลไม่ถูกต้อง';
  if (code.includes('network')) return 'เชื่อมต่อเครือข่ายไม่ได้';
  return e instanceof Error ? e.message : 'สมัครสมาชิกไม่สำเร็จ';
}

export default function SignupScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignUp = async () => {
    setError(null);
    if (!displayName || !email || !password) {
      setError('กรอกข้อมูลให้ครบ');
      return;
    }
    setBusy(true);
    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/(auth)/pricing');
    } catch (e) {
      setError(errMsg(e));
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
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.brand}>
            <Text style={[styles.logo, { color: c.primary }]}>SWIPEPLAY</Text>
            <Text style={[styles.tagline, { color: c.muted }]}>สร้างบัญชีเพื่อเริ่มปัด</Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.title, { color: c.text }]}>สมัครสมาชิก</Text>

            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
              placeholder="ชื่อที่แสดง"
              placeholderTextColor={c.muted}
              value={displayName}
              onChangeText={setDisplayName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
              placeholder="อีเมล"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
              placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
              placeholderTextColor={c.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? <Text style={[styles.error, { color: c.dislike }]}>{error}</Text> : null}

            <Pressable
              onPress={onSignUp}
              disabled={busy}
              style={({ pressed }) => [
                styles.primaryBtn,
                { backgroundColor: c.primary, opacity: busy || pressed ? 0.8 : 1 },
              ]}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>สมัครสมาชิก</Text>
              )}
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={[styles.line, { backgroundColor: c.muted }]} />
              <Text style={[styles.or, { color: c.muted }]}>หรือ</Text>
              <View style={[styles.line, { backgroundColor: c.muted }]} />
            </View>

            <GoogleAuthButton
              label="สมัครด้วย Google"
              disabled={busy}
              onBusy={setBusy}
              onError={(m) => setError(m || null)}
            />
          </View>

          <View style={styles.footer}>
            <Text style={{ color: c.muted }}>มีบัญชีอยู่แล้ว? </Text>
            <Link href="/(auth)/login" style={[styles.link, { color: c.primary }]}>
              เข้าสู่ระบบ
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', gap: 32, paddingVertical: 40 },
  brand: { alignItems: 'center', gap: 6 },
  logo: { fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  tagline: { fontSize: 14 },
  form: { gap: 14 },
  title: { fontSize: 22, fontWeight: '800', marginBottom: 4 },
  input: { borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16 },
  error: { fontSize: 13 },
  primaryBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, opacity: 0.4 },
  or: { fontSize: 13 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  link: { fontWeight: '800' },
});
