/**
 * Slider sound: one detent per stop crossing, one settle when the gesture rests on a stop.
 *
 * The slider is plain Astro script, not a React island, so this module is framework-free and
 * imported by the inline script in `FocusSlider.astro`. It knows nothing about the DOM: the
 * caller feeds it the current position and whether the gesture is live.
 *
 * Rules:
 * - The first focus of a page load is the baseline, never a detent. So is a programmatic
 *   restore from the URL (`?panel=2`): nothing sounds until the user actually moves the slider.
 * - One detent per stop crossing, deduplicated: a drag that crosses 01 -> 02 -> 03 ticks twice,
 *   and sitting still on a stop ticks once and no more.
 * - Rate limited: at most one detent every `DETENT_MIN_GAP_MS`, so a fast flick cannot
 *   machine-gun the tick.
 * - A settle only follows a detent. The settle is the landing of a crossing, so it can never
 *   play before the detent that earned it: the order is always detent, then settle.
 *
 * The baseline is the stop the slider rested on when the page settled, not the stop it happens
 * to rest on when the user grabs it. That matters for the wheel: the browser has already
 * applied the scroll delta by the time the wheel event reaches the script, so arming on the
 * wheel would otherwise capture the destination as the baseline and swallow the first tick.
 *
 * Contract: `.agents/docs/sound.md`, spec `.agents/screens/sound-wiring.md`.
 */

/** Minimum gap between two detents. A fast drag crosses stops faster than this. */
export const DETENT_MIN_GAP_MS = 60;

/** How long the position must hold still before it counts as settled, in milliseconds. */
export const SETTLE_DELAY_MS = 140;

/** How close to a stop the position must be (as a fraction of one stop) to count as on it. */
export const SETTLE_TOLERANCE = 0.06;

export interface SliderSoundOptions {
  /** Play a slice. Injected so the caller decides between `window.sound.play` and a stub. */
  play: (name: 'slider-detent' | 'slider-settle') => void;
  /** The current position, in stops (0.3 means 30% between stop 0 and stop 1). */
  position: () => number;
}

export interface SliderSound {
  /**
   * Report a new position. Plays a detent when the nearest stop changed since the last report,
   * and schedules a settle when the position rests on a stop.
   */
  update: () => void;
  /** Report that the user has taken control of the slider. From then on, movement is audible. */
  arm: () => void;
  /** True once the user has moved the slider. */
  readonly armed: boolean;
}

/**
 * Build the slider sound controller.
 *
 * @param stops The stop positions, e.g. `[0, 1, 2, 3]` for four panels.
 */
export function createSliderSound(
  stops: readonly number[],
  options: SliderSoundOptions,
): SliderSound {
  /** The stop index nearest to the current position. */
  const nearestStop = (): number => {
    const p = options.position();
    let best = 0;
    let bestDist = Infinity;
    stops.forEach((s, i) => {
      const d = Math.abs(s - p);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    return best;
  };

  /** True once the user has taken hold of the slider. */
  let armed = false;
  /**
   * The stop the focus rested on the last time the controller looked. This is seeded with the
   * stop the slider starts on, so the very first crossing after the user takes hold of it is a
   * crossing and not a baseline.
   */
  let lastStop = nearestStop();
  /** The stop index the last detent was played for. -1 means "none yet". */
  let lastDetentStop = -1;
  /** The last time a detent played, for the rate limit. */
  let lastDetentAt = -Infinity;
  /** True when a detent has fired since the last settle, i.e. a crossing is waiting to land. */
  let crossing = false;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  /** The stop the pending settle belongs to, so a stale timer cannot settle on the wrong one. */
  let pendingSettleStop = -1;

  /** The distance between two adjacent stops, used to scale the settle tolerance. */
  const step = (): number => {
    const gap = Math.abs((stops[1] ?? 1) - (stops[0] ?? 0));
    return gap || 1;
  };

  /** True when the position rests on a stop. */
  const onStop = (): boolean => {
    const p = options.position();
    const s = stops[nearestStop()] ?? 0;
    return Math.abs(p - s) <= step() * SETTLE_TOLERANCE;
  };

  const clearSettle = () => {
    if (settleTimer !== undefined) {
      clearTimeout(settleTimer);
      settleTimer = undefined;
    }
    pendingSettleStop = -1;
  };

  /** Play the detent for a stop, subject to the rate limit and the one-per-stop rule. */
  const detent = (stop: number, now: number) => {
    if (stop === lastDetentStop) return;
    if (now - lastDetentAt < DETENT_MIN_GAP_MS) return;
    lastDetentStop = stop;
    lastDetentAt = now;
    // A detent opens a crossing. The settle is its landing, so the two can never swap order.
    crossing = true;
    options.play('slider-detent');
  };

  const update = () => {
    if (!armed) return;
    const now = Date.now();
    const stop = nearestStop();
    // A crossing: the nearest stop changed from the last look. One detent per stop, however
    // fast the crossing. Before the user takes hold of the slider, update() does not run, so
    // the load-time stop stays the baseline.
    if (stop !== lastStop) {
      lastStop = stop;
      detent(stop, now);
    }
    clearSettle();
    // No crossing means no settle: the settle is the landing of a detent, never a sound on its
    // own. This is what keeps the order detent-then-settle structural rather than incidental.
    if (!crossing || !onStop()) return;
    pendingSettleStop = stop;
    settleTimer = setTimeout(() => {
      settleTimer = undefined;
      const settled = pendingSettleStop;
      pendingSettleStop = -1;
      if (settled < 0) return;
      // The position must still rest on the same stop when the timer fires.
      if (nearestStop() !== settled || !onStop()) return;
      options.play('slider-settle');
      // The crossing has landed. The detent for this stop stays spent, so resting on it does
      // not tick again; leaving and coming back does, because the crossing changed the stop.
      crossing = false;
    }, SETTLE_DELAY_MS);
  };

  const arm = () => {
    if (armed) return;
    armed = true;
    // Arming is not a detent, so it must not spend the rate limit: the first crossing of the
    // gesture is often only a few milliseconds away (a wheel nudge scrolls before the next
    // frame), and a rate limit spent here would swallow that first tick.
    lastDetentAt = -Infinity;
    // Arming is not a crossing: resting on the baseline stop must not settle.
    crossing = false;
  };

  return {
    update,
    arm,
    get armed() {
      return armed;
    },
  };
}
