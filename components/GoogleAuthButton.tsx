import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/store/auth';

WebBrowser.maybeCompleteAuthSession();

const WEB_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// The client id Google.useAuthRequest REQUIRES for the current platform.
// If it's missing the hook throws at render, so we only mount the hook-bearing
// child when this is present and otherwise show a disabled fallback.
function platformClientId(): string | undefined {
  if (Platform.OS === 'ios') return IOS_ID;
  if (Platform.OS === 'android') return ANDROID_ID;
  return WEB_ID; // web
}

type Props = {
  label: string;
  disabled?: boolean;
  onBusy?: (busy: boolean) => void;
  onError?: (msg: string) => void;
};

export function GoogleAuthButton(props: Props) {
  // Conditionally render the hook-bearing child. When the platform client id is
  // absent (e.g. Expo Go on iOS with only a web client id), render a disabled
  // button — never call useAuthRequest without its required id.
  if (!platformClientId()) return <DisabledGoogleButton label={props.label} />;
  return <EnabledGoogleButton {...props} />;
}

function DisabledGoogleButton({ label }: { label: string }) {
  const c = Colors[useColorScheme() ?? 'dark'];
  return (
    <>
      <Pressable disabled style={[styles.btn, { borderColor: c.muted, opacity: 0.5 }]}>
        <Ionicons name="logo-google" size={18} color={c.text} />
        <Text style={[styles.text, { color: c.text }]}>{label}</Text>
      </Pressable>
      <Text style={[styles.hint, { color: c.muted }]}>
        Google ใช้ได้บนเว็บหรือ dev build (ตั้งค่า client id ของแพลตฟอร์มนี้)
      </Text>
    </>
  );
}

function EnabledGoogleButton({ label, disabled, onBusy, onError }: Props) {
  const c = Colors[useColorScheme() ?? 'dark'];
  const { googleSignIn } = useAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_ID,
    iosClientId: IOS_ID,
    androidClientId: ANDROID_ID,
  });

  useEffect(() => {
    if (response?.type !== 'success') return;
    const idToken =
      (response.params?.id_token as string | undefined) ?? response.authentication?.idToken;
    if (!idToken) return;
    onBusy?.(true);
    onError?.('');
    googleSignIn(idToken)
      .catch((e) => onError?.(e instanceof Error ? e.message : 'เข้าสู่ระบบด้วย Google ไม่สำเร็จ'))
      .finally(() => onBusy?.(false));
  }, [response, googleSignIn, onBusy, onError]);

  const off = !request || disabled;
  return (
    <Pressable
      onPress={() => promptAsync().catch(() => {})}
      disabled={off}
      style={({ pressed }) => [
        styles.btn,
        { borderColor: c.muted, opacity: off ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      <Ionicons name="logo-google" size={18} color={c.text} />
      <Text style={[styles.text, { color: c.text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 13,
  },
  text: { fontSize: 15, fontWeight: '700' },
  hint: { fontSize: 12, textAlign: 'center' },
});
