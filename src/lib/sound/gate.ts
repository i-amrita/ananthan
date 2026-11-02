/**
 * Preload gate for the sound engine.
 *
 * Two terminal states, both safe:
 * - `ready`: the sprite decoded, sounds play (subject to mute).
 * - `failed`: the sprite failed to load or decode within 6 s. The site stays usable and silent.
 *
 * Signals:
 * - `html[data-sound-ready]` is set (empty value) when ready, `"failed"` when failed.
 * - a `sound:ready` DOM event fires once on `window` with the status in `detail`.
 * - `onSoundReady(cb)` for vanilla and Astro scripts.
 *
 * The event fires on failure too (with `failed`), so listeners never hang.
 * Contract: `.agents/docs/sound.md`.
 */
import { getStatus, initSound, subscribeStatus, type SoundStatus } from './engine';

export type { SoundStatus };

/** The gate flipped to a terminal state. */
export interface SoundReadyDetail {
  status: Exclude<SoundStatus, 'loading'>;
}

/** Kick the engine off. Called once from the inline head script; later calls are no-ops. */
export function armSoundGate(): void {
  initSound();
}

let announced = false;

/** Flip `html[data-sound-ready]` and fire `sound:ready` exactly once per page load. */
function announce(): void {
  if (announced || typeof document === 'undefined') return;
  const status = getStatus();
  if (status === 'loading') return;
  announced = true;
  document.documentElement.dataset.soundReady = status === 'failed' ? 'failed' : '';
  window.dispatchEvent(new CustomEvent<SoundReadyDetail>('sound:ready', { detail: { status } }));
}

/**
 * Subscribe to the gate. The callback fires with the status as soon as it is known, including
 * when the page loaded with the gate already settled. Returns the unsubscribe function.
 */
export function onSoundReady(cb: (detail: SoundReadyDetail) => void): () => void {
  armSoundGate();
  const unsubscribe = subscribeStatus(() => {
    const status = getStatus();
    if (status === 'loading') return;
    cb({ status });
  });
  const status = getStatus();
  if (status !== 'loading') cb({ status });
  return unsubscribe;
}

// The gate lives outside any framework lifecycle: it arms itself on import in the browser and
// announces on every status change from then on.
if (typeof window !== 'undefined') {
  armSoundGate();
  subscribeStatus(() => announce());
  announce();
}
