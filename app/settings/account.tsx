/**
 * Account settings — edit display name + avatar (real: Firestore profile), reset password
 * (Firebase sendPasswordResetEmail), sign out, delete account (Firebase deleteUser).
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { deleteUser, sendPasswordResetEmail } from 'firebase/auth';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth } from '@/src/firebase/config';
import { useT } from '@/src/i18n';
import { useAuth } from '@/src/store/auth';

export default function AccountScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const t = useT();
  const { user, profile, signOut, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.displayName ?? user?.displayName ?? '');
  const email = profile?.email ?? user?.email ?? '';

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert(t('account.nameEmpty'));
      return;
    }
    void updateProfile({ displayName: trimmed }).catch(() => {});
    Alert.alert(t('account.nameSaved'));
  };

  const changePassword = () => {
    if (!email) return;
    sendPasswordResetEmail(auth, email)
      .then(() => Alert.alert(t('account.passwordResetSent'), t('account.passwordResetSentBody', { email })))
      .catch(() => Alert.alert(t('account.changePassword'), t('common.tryAgain')));
  };

  const doLogout = () => {
    Alert.alert(t('account.signOutConfirm'), t('account.signOutConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.signOut'),
        style: 'destructive',
        onPress: () => {
          void signOut().catch(() => {});
          router.replace('/(tabs)');
        },
      },
    ]);
  };

  const doDelete = () => {
    Alert.alert(t('account.deleteConfirm'), t('account.deleteConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('account.deleteAccount'),
        style: 'destructive',
        onPress: () => {
          const cur = auth.currentUser;
          if (!cur) {
            router.replace('/(tabs)');
            return;
          }
          deleteUser(cur)
            .then(() => router.replace('/(tabs)'))
            .catch((e: unknown) => {
              const code = (e as { code?: string })?.code ?? '';
              if (code === 'auth/requires-recent-login') {
                Alert.alert(t('account.deleteAccount'), t('account.deleteReauthNeeded'));
              } else {
                Alert.alert(t('account.deleteFailed'));
              }
            });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      {/* Avatar (editable — preset or upload) */}
      <View style={styles.avatarWrap}>
        <Avatar
          value={profile?.avatar ?? user?.photoURL ?? null}
          name={name}
          size={96}
          editable
          uploadUid={user?.uid}
          onChange={(url) => void updateProfile({ avatar: url }).catch(() => {})}
        />
      </View>

      {/* Name */}
      <Field label={t('account.nameLabel')} color={c.muted}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t('account.namePlaceholder')}
          placeholderTextColor={c.muted}
          style={[styles.input, { backgroundColor: c.surface, color: c.text }]}
        />
      </Field>
      <PrimaryButton c={c} label={t('account.saveName')} onPress={saveName} />

      {/* Email (read-only display) */}
      <Field label={t('account.emailLabel')} color={c.muted}>
        <View style={[styles.input, styles.readonly, { backgroundColor: c.surface }]}>
          <Text style={{ color: c.text }} numberOfLines={1}>
            {email || '—'}
          </Text>
        </View>
      </Field>

      <View style={styles.list}>
        <ListButton c={c} icon="key-outline" label={t('account.changePassword')} onPress={changePassword} last />
      </View>

      {/* Danger zone */}
      <View style={styles.list}>
        <ListButton c={c} icon="log-out-outline" label={t('common.signOut')} tint={c.text} onPress={doLogout} />
        <ListButton c={c} icon="trash-outline" label={t('account.deleteAccount')} tint={c.dislike} onPress={doDelete} last />
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
