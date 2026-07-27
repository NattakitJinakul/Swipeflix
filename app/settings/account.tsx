/**
 * Account settings — edit name/avatar (mock), change email/password (mock),
 * logout (useAuth.signOut), delete account (confirm dialog, mock).
 * See docs/10-profile-settings.md (บัญชี).
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/src/store';

export default function AccountScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const email = profile?.email ?? user?.email ?? '';
  const avatar = profile?.avatar ?? user?.photoURL ?? null;
  const initial = (name.trim().charAt(0) || '?').toUpperCase();

  const saveName = () => {
    // TODO: wire to updateProfile / Firestore. Mock for now.
    Alert.alert('บันทึกชื่อแล้ว', name.trim() ? `ชื่อใหม่: ${name.trim()}` : 'ชื่อว่าง');
  };

  const notImplemented = (what: string) =>
    Alert.alert(what, 'ฟีเจอร์นี้จะเปิดใช้เร็ว ๆ นี้');

  const doLogout = () => {
    Alert.alert('ออกจากระบบ', 'ต้องการออกจากระบบใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: () => {
          void signOut().catch(() => {});
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const doDelete = () => {
    Alert.alert('ลบบัญชี', 'การลบบัญชีถาวรและกู้คืนไม่ได้ ต้องการดำเนินการต่อ?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบบัญชี',
        style: 'destructive',
        // TODO: wire to real account deletion. Mock: sign out.
        onPress: () => {
          void signOut().catch(() => {});
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.primary }]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <Pressable
          onPress={() => notImplemented('เปลี่ยนรูปโปรไฟล์')}
          style={({ pressed }) => [styles.avatarEdit, { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 }]}
        >
          <Ionicons name="camera" size={16} color={c.text} />
          <Text style={[styles.avatarEditText, { color: c.text }]}>เปลี่ยนรูป</Text>
        </Pressable>
      </View>

      {/* Name */}
      <Field label="ชื่อที่แสดง" color={c.muted}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="ชื่อของคุณ"
          placeholderTextColor={c.muted}
          style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
        />
      </Field>
      <PrimaryButton c={c} label="บันทึกชื่อ" onPress={saveName} />

      {/* Email (read-only display) */}
      <Field label="อีเมล" color={c.muted}>
        <View style={[styles.input, styles.readonly, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.text }} numberOfLines={1}>
            {email || '—'}
          </Text>
        </View>
      </Field>

      <View style={styles.list}>
        <ListButton c={c} icon="mail-outline" label="เปลี่ยนอีเมล" onPress={() => notImplemented('เปลี่ยนอีเมล')} />
        <ListButton c={c} icon="key-outline" label="เปลี่ยนรหัสผ่าน" onPress={() => notImplemented('เปลี่ยนรหัสผ่าน')} last />
      </View>

      {/* Danger zone */}
      <View style={styles.list}>
        <ListButton c={c} icon="log-out-outline" label="ออกจากระบบ" tint={c.text} onPress={doLogout} />
        <ListButton c={c} icon="trash-outline" label="ลบบัญชี" tint={c.dislike} onPress={doDelete} last />
      </View>
    </ScrollView>
  );
}

type Colorset = (typeof Colors)['dark'];

function Field({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color }]}>{label}</Text>
      {children}
    </View>
  );
}

function PrimaryButton({ c, label, onPress }: { c: Colorset; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
    >
      <Text style={styles.primaryBtnText}>{label}</Text>
    </Pressable>
  );
}

function ListButton({
  c,
  icon,
  label,
  onPress,
  tint,
  last,
}: {
  c: Colorset;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  tint?: string;
  last?: boolean;
}) {
  const color = tint ?? c.text;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.listRow,
        { backgroundColor: c.surface, opacity: pressed ? 0.7 : 1 },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.background },
      ]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={[styles.listLabel, { color }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={c.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  avatarWrap: { alignItems: 'center', gap: 10, marginTop: 8 },
  avatar: { width: 96, height: 96, borderRadius: 999 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#fff', fontSize: 40, fontWeight: '900' },
  avatarEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  avatarEditText: { fontWeight: '700', fontSize: 13 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontWeight: '700', paddingHorizontal: 4 },
  input: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15 },
  readonly: { justifyContent: 'center' },
  primaryBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  list: { borderRadius: 14, overflow: 'hidden', marginTop: 4 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  listLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
