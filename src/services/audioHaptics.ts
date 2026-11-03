import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { loadSettings } from './storage';

export type HapticType = 'selection' | 'success' | 'warning' | 'impactLight' | 'impactHeavy';

/**
 * Triggers haptic feedback if enabled in settings and supported on current platform.
 */
export async function triggerHaptic(type: HapticType = 'selection'): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const settings = await loadSettings();
    if (!settings.vibration) return;

    switch (type) {
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'impactLight':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactHeavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
  } catch {
    // Ignore unsupported device errors
  }
}

