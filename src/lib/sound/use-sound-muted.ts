/**
 * React binding for the mute state. Kept apart from the gate hook so a component can ask
 * "is the site silent?" without subscribing to the readiness signal.
 */
import { useSyncExternalStore } from 'react';

import { isMuted, subscribeMuted } from './engine';

/** True when the site is silent (URL, stored preference or an explicit choice). */
export function useSoundMuted(): boolean {
  return useSyncExternalStore(
    subscribeMuted,
    isMuted,
    // The server never knows the preference: assume audible, the client corrects it on mount.
    () => false,
  );
}
