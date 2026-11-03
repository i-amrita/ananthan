/**
 * React bindings for the DOM sound gate. Kept apart from `gate-dom.ts` so Astro pages can import
 * the vanilla gate without pulling React into an inline script.
 */
import { useSyncExternalStore } from 'react';

import { gateLive, readGateState, subscribeGate, type GateState } from './gate-dom';

export type { GateState };

/** React hook: the gate state as the DOM sees it, re-rendering when the attributes flip. */
export function useSoundGate(): GateState {
  return useSyncExternalStore(subscribeGate, readGateState, () => 'loading' as const);
}

/** React hook: true when the held controls must work (ready, failed or muted). */
export function useSoundGateLive(): boolean {
  return useSyncExternalStore(
    subscribeGate,
    () => gateLive(),
    () => true,
  );
}
