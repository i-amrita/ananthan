/**
 * React bindings for the sound gate. Kept apart from `gate.ts` so Astro pages can import the
 * vanilla gate without pulling React into an inline script.
 */
import { useSyncExternalStore } from 'react';

import { getStatus, subscribeStatus, type SoundStatus } from './engine';

export type { SoundStatus };

/** React hook: the current gate status, re-rendering when it flips. */
export function useSoundReady(): SoundStatus {
  return useSyncExternalStore(subscribeStatus, getStatus, () => 'loading' as const);
}
