import type { AudioPlayer } from "expo-audio";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";
import { AUDIO_ASSETS } from "../constants/gameAssets";
import { loadSettings } from "./storage";

let backgroundMusicSound: AudioPlayer | null = null;
let currentPlayingTrack: string | null = null;
let isAudioConfigured = false;

async function configureAudio() {
  if (isAudioConfigured) return;

  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: "duckOthers",
      shouldPlayInBackground: false,
    });

    isAudioConfigured = true;
  } catch (err) {
    console.warn("Audio mode configuration failed:", err);
  }
}

/**
 * Play a short sound effect and release its player after playback.
 */
async function playSound(source: any, volume = 1.0): Promise<void> {
  let player: AudioPlayer | null = null;

  try {
    const settings = await loadSettings();
    if (!settings.soundEffects) return;

    await configureAudio();

    player = createAudioPlayer(source);
    player.volume = volume;

    const currentPlayer = player;

    const subscription = player.addListener(
      "playbackStatusUpdate",
      (status) => {
        if (status.didJustFinish) {
          subscription.remove();
          currentPlayer.remove();
        }
      },
    );

    player.play();
  } catch (err) {
    player?.remove();
  }
}

/**
 * Play card spread sound.
 */
export async function playCardSpreadSound(
  speed?: "slow" | "medium" | "fast" | "instant",
) {
  if (speed === "instant") return;

  try {
    const settings = await loadSettings();
    if (!settings.soundEffects || settings.spreadSound === false) return;

    await playSound(AUDIO_ASSETS.cardSpread, 0.9);
  } catch {
    // Ignore sound errors.
  }
}

/**
 * Play card placement sound.
 */
export async function playCardPlaceSound() {
  try {
    const settings = await loadSettings();
    if (!settings.soundEffects || settings.cardMoveSound === false) return;

    await playSound(AUDIO_ASSETS.cardPlace, 0.7);
  } catch {
    // Ignore sound errors.
  }
}

/**
 * Force play spread sound for settings/store previews.
 */
export async function forcePlaySpreadSound() {
  try {
    await configureAudio();
    await playSound(AUDIO_ASSETS.cardSpread, 0.9);
  } catch (err) {
    console.warn("Spread preview failed:", err);
  }
}

/**
 * Force play card placement sound for previews.
 */
export async function forcePlayPlaceSound() {
  try {
    await configureAudio();
    await playSound(AUDIO_ASSETS.cardPlace, 0.8);
  } catch (err) {
    console.warn("Place preview failed:", err);
  }
}

/**
 * Play card slide sound.
 */
export async function playCardSlideSound() {
  try {
    const settings = await loadSettings();
    if (!settings.soundEffects || settings.cardMoveSound === false) return;

    await playSound(AUDIO_ASSETS.cardSlide, 0.6);
  } catch {
    // Ignore sound errors.
  }
}

/**
 * Play card shuffle sound.
 */
export async function playCardShuffleSound() {
  try {
    const settings = await loadSettings();
    if (!settings.soundEffects) return;

    await playSound(AUDIO_ASSETS.cardShuffle, 0.8);
  } catch {
    // Ignore sound errors.
  }
}

/**
 * Start or switch background music.
 */
export async function playBackgroundMusic(
  trackId?: "none" | "sound1" | "sound2",
) {
  try {
    const settings = await loadSettings();
    const targetTrack = trackId || settings.musicTrack || "sound1";

    if (!settings.musicEnabled || targetTrack === "none") {
      await stopBackgroundMusic();
      return;
    }

    if (currentPlayingTrack === targetTrack && backgroundMusicSound) {
      return;
    }

    await stopBackgroundMusic();
    await configureAudio();

    const source =
      targetTrack === "sound2"
        ? AUDIO_ASSETS.musicTrack2
        : AUDIO_ASSETS.musicTrack1;

    const player = createAudioPlayer(source);

    player.loop = true;
    player.volume = 0.35;
    player.play();

    backgroundMusicSound = player;
    currentPlayingTrack = targetTrack;
  } catch (err) {
    console.warn("Background music playback error:", err);
  }
}

/**
 * Stop and release background music.
 */
export async function stopBackgroundMusic() {
  if (!backgroundMusicSound) return;

  try {
    backgroundMusicSound.pause();
    backgroundMusicSound.remove();
  } catch {
    // Ignore cleanup errors.
  } finally {
    backgroundMusicSound = null;
    currentPlayingTrack = null;
  }
}
