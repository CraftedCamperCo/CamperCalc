import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

function supported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export async function tapHaptic() {
  if (!supported()) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function successHaptic() {
  if (!supported()) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

