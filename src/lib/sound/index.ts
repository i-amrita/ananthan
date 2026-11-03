/**
 * Barrel for the sound engine. Islands import from `@/lib/sound` so the import surface stays
 * small; Astro inline scripts import `gate` directly to stay React-free.
 */
export {
  getAudioContext,
  getStatus,
  initSound,
  isMuted,
  isSoundDecoded,
  MUTE_STORAGE_KEY,
  mutedByUrl,
  play,
  resetSoundCalls,
  setMuted,
  soundCalls,
  subscribeStatus,
  type PlayOptions,
  type SoundStatus,
} from './engine';
export { armSoundGate, onSoundReady, type SoundReadyDetail } from './gate';
export {
  gateLive,
  installGate,
  readGateState,
  readMuted,
  subscribeGate,
  type GateState,
} from './gate-dom';
export { SPRITE, SOUND_NAMES, SPRITE_HASH, type SoundName, spriteUrl } from './sprite';
export { subscribeMuted } from './engine';
export { useSoundGate, useSoundGateLive } from './use-sound-gate';
export { useSoundMuted } from './use-sound-muted';
export { useSoundReady } from './use-sound-ready';
// Installs window.sound for the Astro-side scripts (the focus slider) and the e2e suite.
import './global';
export type { SoundGlobal } from './global';
