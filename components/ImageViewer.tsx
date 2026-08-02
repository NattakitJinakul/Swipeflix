/**
 * Fullscreen image viewer — a black modal with a swipeable gallery of images shown at full
 * size (contentFit contain). Double-tap an image to zoom in/out. Close button + page counter.
 */
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: W, height: H } = Dimensions.get('window');

function ZoomImage({ uri }: { uri: string }) {
  const scale = useSharedValue(1);
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(scale.value > 1 ? 1 : 2.4, { duration: 200 });
    });
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[styles.page, style]}>
        <Image source={{ uri }} style={styles.img} contentFit="contain" transition={150} />
      </Animated.View>
    </GestureDetector>
  );
}

export function ImageViewer({
  images,
  initialIndex = 0,
  visible,
  onClose,
}: {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [idx, setIdx] = useState(initialIndex);
  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          contentOffset={{ x: initialIndex * W, y: 0 }}
          onMomentumScrollEnd={(e) => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
        >
          {images.map((uri, i) => (
            <ZoomImage key={`${uri}-${i}`} uri={uri} />
          ))}
        </ScrollView>

        <Pressable
          onPress={onClose}
          hitSlop={12}
          style={[styles.close, { top: insets.top + 8 }]}
        >
          <Ionicons name="close" size={26} color="#fff" />
        </Pressable>

        {images.length > 1 ? (
          <View style={[styles.counter, { bottom: insets.bottom + 18 }]}>
            <Text style={styles.counterText}>
              {idx + 1} / {images.length}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  page: { width: W, height: H, alignItems: 'center', justifyContent: 'center' },
  img: { width: W, height: H },
  close: {
    position: 'absolute',
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counter: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  counterText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
