/**
 * The global sound API, exposed on `window.sound`.
 *
 * Why a global and not only module imports: the focus slider is plain Astro script, not a React
 * island, and the shutter is a React island. A single documented global lets both sides call
 * the engine without duplicating import paths, and it gives the e2e suite a stable handle
 * against the built site.
 *
 * The global is read-only in practice: every method delegates to the engine, and the engine
 * keeps its own state.
 */
import {
  getStatus,
  isMuted,
  isSoundDecoded,
  mutedByUrl,
  play,
  setMuted,
  type PlayOptions,
  type SoundStatus,
} from './engine';
import { onSoundReady, type SoundReadyDetail } from './gate';
import { type SoundName } from './sprite';

export interface SoundGlobal {
  /** Play one sprite slice. No-op when muted, before the sprite is decoded, or while locked. */
  play: (name: SoundName, options?: PlayOptions) => void;
  /** Subscribe to the preload gate. Fires with `ready` or `failed`. */
  onSoundReady: (cb: (detail: SoundReadyDetail) => void) => () => void;
  /** Current gate status: `loading`, `ready` or `failed`. */
  getStatus: () => SoundStatus;
  /** True when the sprite is decoded, i.e. sounds will play if not muted. */
  isDecoded: () => boolean;
  /** True when the site is silent (URL, stored preference or an explicit choice). */
  isMuted: () => boolean;
  /** True when `?mute=1` is the reason the site is silent. */
  mutedByUrl: () => boolean;
  /** Mute or unmute, and remember the choice. */
  setMuted: (value: boolean) => void;
}

declare global {
  interface Window {
    sound?: SoundGlobal;
  }
}

if (typeof window !== 'undefined') {
  window.sound = {
    play,
    onSoundReady,
    getStatus,
    isDecoded: isSoundDecoded,
    isMuted,
    mutedByUrl,
    setMuted,
  };
}
