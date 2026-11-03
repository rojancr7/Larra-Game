import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';

/**
 * Locks the screen orientation to landscape for professional card table gameplay.
 */
export async function lockToLandscape(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.LANDSCAPE,
    );
  } catch (err) {
    console.warn('ScreenOrientation lockToLandscape error:', err);
  }
}

/**
 * Unlocks orientation or restores to portrait when returning to menus.
 */
export async function restorePortraitOrientation(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(
      ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  } catch (err) {
    console.warn('ScreenOrientation restorePortraitOrientation error:', err);
  }
}

/**
 * Allows full rotation if desired.
 */
export async function unlockOrientation(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.unlockAsync();
  } catch (err) {
    console.warn('ScreenOrientation unlockOrientation error:', err);
  }
}

