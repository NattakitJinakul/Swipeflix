/**
 * Avatar — circular avatar from a URL (uploaded photo or a DiceBear preset).
 * The stored value (profile.avatar) is always a plain URL string, so display is just an image
 * with an initial fallback. The `editable` variant opens a sheet to pick a preset or upload a photo.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { uploadAvatar } from '@/src/firebase/storage';
import { useT } from '@/src/i18n';

/** Built-in avatars (DiceBear — no storage needed). The seed varies the generated bot. */
export const AVATAR_PRESETS: string[] = [
  'Ace', 'Nova', 'Pixel', 'Zed', 'Kira', 'Milo', 'Rex', 'Luna',
].map((seed) => `https://api.dicebear.com/7.x/bottts/png?seed=${seed}`);

export type AvatarProps = {
  value?: string | null;
  name?: string;
  size?: number;
  editable?: boolean;
  /** Required when editable + upload is used. */
  uploadUid?: string;
  onChange?: (value: string) => void;
};

export function Avatar({ value, name, size = 88, editable, uploadUid, onChange }: AvatarProps) {
  const scheme = useColorScheme() ?? 'dark';
  const c = Colors[scheme];
  const t = useT();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  const initial = (name?.trim().charAt(0) || '?').toUpperCase();
  const radius = size / 2;

  const face = value ? (
    <Image source={{ uri: value }} style={{ width: size, height: size, borderRadius: radius }} contentFit="cover" transition={150} />
  ) : (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: radius, backgroundColor: c.primary }]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>{initial}</Text>
    </View>
  );

  const pickPhoto = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('avatar.title'), t('avatar.permissionNeeded'));
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
      });
      if (res.canceled || !res.assets?.[0]?.uri) return;
      if (!uploadUid) return;
      setUploading(true);
      const url = await uploadAvatar(uploadUid, res.assets[0].uri);
      onChange?.(url);
      setOpen(false);
    } catch {
      Alert.alert(t('avatar.title'), t('avatar.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const choosePreset = (url: string) => {
    onChange?.(url);
    setOpen(false);
  };

  if (!editable) return face;

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
        {face}
        <View style={[styles.editBadge, { backgroundColor: c.primary, borderColor: c.background }]}>
          <Ionicons name="camera" size={14} color="#fff" />
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={[styles.sheet, { backgroundColor: c.surface }]}>
          <View style={styles.sheetHeader}>
            <Text style={[styles.sheetTitle, { color: c.text }]}>{t('avatar.title')}</Text>
            <Pressable hitSlop={10} onPress={() => setOpen(false)}>
              <Ionicons name="close" size={24} color={c.muted} />
            </Pressable>
          </View>

          <Text style={[styles.sectionLabel, { color: c.muted }]}>{t('avatar.presets')}</Text>
          <View style={styles.grid}>
            {AVATAR_PRESETS.map((url) => (
              <Pressable
                key={url}
                onPress={() => choosePreset(url)}
                style={({ pressed }) => [styles.presetWrap, { borderColor: value === url ? c.primary : 'transparent', opacity: pressed ? 0.8 : 1 }]}
              >
                <Image source={{ uri: url }} style={styles.preset} contentFit="cover" transition={120} />
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={pickPhoto}
            disabled={uploading}
            style={({ pressed }) => [styles.uploadBtn, { backgroundColor: c.primary, opacity: uploading || pressed ? 0.85 : 1 }]}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                <Text style={styles.uploadText}>{t('avatar.uploadPhoto')}</Text>
              </>
            )}
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontWeight: '900' },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sectionLabel: { fontSize: 13, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  presetWrap: { borderRadius: 999, borderWidth: 2, padding: 2 },
  preset: { width: 64, height: 64, borderRadius: 999 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 6,
  },
  uploadText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
