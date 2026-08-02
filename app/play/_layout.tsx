/**
 * Play stack — hosts the mini-games launched from the "สนุก" tab hub.
 * Guest-friendly: no auth needed to play. Header hidden (screens draw their own).
 */
import { Stack } from 'expo-router';

export default function PlayLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="guess" />
      <Stack.Screen name="vs" />
    </Stack>
  );
}
