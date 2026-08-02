/**
 * Settings home — grouped list. Account / Preferences / Content / Data / About.
 * Nav rows push sub-pages; quick toggles + actions handled inline. No subscription/payment.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useT } from '@/src/i18n';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsIndex() {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const router = useRouter();
  const t = useT();

  const [notifyNew, setNotifyNew] = useState(false);
  const [hideAdult, setHideAdult] = useState(true);

  const clearImageCache = () => {
    Promise.allSettled([Image.clearMemoryCache(), Image.clearDiskCache()]).then(() =>
      Alert.alert(t('settings.cacheClearedTitle'), t('settings.cacheClearedBody')),
    );
  };

  return (
    <ScrollView
      style={{ backgroundColor: c.background }}
      contentContainerStyle={styles.content}
    >
      <Group title={t('settings.groupAccount')} color={c.muted}>
        <NavRow c={c} icon="person-circle-outline" label={t('settings.rowProfileAccount')} onPress={() => router.push('/settings/account')} />
      </Group>

      <Group title={t('settings.groupPreferences')} color={c.muted}>
        <NavRow c={c} icon="options-outline" label={t('settings.rowPreferences')} onPress={() => router.push('/settings/preferences')} />
      </Group>

      <Group title={t('settings.groupContent')} color={c.muted}>
        <ToggleRow c={c} icon="eye-off-outline" label={t('settings.hideAdult')} value={hideAdult} onChange={setHideAdult} />
        <ToggleRow c={c} icon="notifications-outline" label={t('settings.notifyNew')} value={notifyNew} onChange={setNotifyNew} last />
      </Group>

      <Group title={t('settings.groupData')} color={c.muted}>
        <ActionRow c={c} icon="image-outline" label={t('settings.clearCache')} onPress={clearImageCache} last />
      </Group>

      <Group title={t('settings.groupAbout')} color={c.muted}>
        <NavRow c={c} icon="information-circle-outline" label={t('settings.rowAbout')} onPress={() => router.push('/settings/about')} last />
      </Group>
    </ScrollView>
  );
}

function Group({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={[styles.groupTitle, { color }]}>{title.toUpperCase()}</Text>
      <View style={styles.groupBody}>{children}</View>
    </View>
  );
}

type Colorset = (typeof Colors)['dark'];

function RowShell({
  c,
  icon,
  label,
  right,
  onPress,
  last,
}: {
  c: Colorset;
  icon: IoniconName;
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: c.surface, opacity: pressed && onPress ? 0.7 : 1 },
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.background },
      ]}
    >
      <Ionicons name={icon} size={20} color={c.primary} />
      <Text style={[styles.rowLabel, { color: c.text }]}>{label}</Text>
      {right}
    </Pressable>
  );
}

function NavRow(props: { c: Colorset; icon: IoniconName; label: string; onPress: () => void; last?: boolean }) {
  return (
    <RowShell
      {...props}
      right={<Ionicons name="chevron-forward" size={18} color={props.c.muted} />}
    />
  );
}

function ActionRow(props: { c: Colorset; icon: IoniconName; label: string; onPress: () => void; last?: boolean }) {
  return <RowShell {...props} />;
}

function ToggleRow({
  c,
  icon,
  label,
  value,
  onChange,
  last,
}: {
  c: Colorset;
  icon: IoniconName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <RowShell
      c={c}
      icon={icon}
      label={label}
      last={last}
      right={
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: c.primary, false: c.muted }}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 22 },
  group: { gap: 8 },
  groupTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5, paddingHorizontal: 4 },
  groupBody: { borderRadius: 14, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  rowLabel: { flex: 1, fontSize: 15, fontWeight: '600' },
});
