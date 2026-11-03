import { useRef, useState } from 'react';

import { LOCALES, LOCALE_NAMES, m, useLocale } from '@/lib/i18n';
import { play } from '@/lib/sound';
import { useSoundGateLive } from '@/lib/sound/use-sound-gate';
import { cn } from '@/lib/utils';

import { Providers } from './Providers';

const BLADES = [0, 1, 2, 3, 4, 5] as const;

/**
 * Aperture dial: 72deg per locale stop, so the iris travels one full turn across the five locales.
 * Each flip advances the iris by one stop with a spring ease (none under prefers-reduced-motion).
 */
const STEP_DEG = 360 / LOCALES.length;

/** One iris blade: a wedge clipped out of a full-size span, rotated into place. The wrapper's drop-shadow draws the blade edge. */
function Blade({ index }: { index: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute inset-0 [filter:drop-shadow(-0.75px_0.5px_0.5px_rgb(0_0_0/0.45))]"
      style={{ transform: `rotate(${index * 60}deg)` }}
    >
      <span
        className="absolute inset-0 bg-linear-to-br from-surface-muted via-surface to-surface"
        style={{ clipPath: 'polygon(50% 34%, 50% -2%, 104% -2%, 104% 46%, 61% 42%)' }}
      />
    </span>
  );
}

function Shutter() {
  const { locale, setLocale } = useLocale();
  // The iris accumulates one stop (72deg) per flip, so a tap always animates forward even at the
  // wrap point (5 stops = 360deg back to the same blade orientation).
  const [stops, setStops] = useState(0);
  const busy = useRef(false);
  // The gate: the shutter stays silent while the sprite loads. `live` is true once the sprite
  // is decoded or has failed (the site works without sound), or the site is muted. The hold
  // itself (`inert`, `aria-disabled`, the skeleton look) is not React's job: the DOM gate in
  // `sound/gate-dom.ts` owns those attributes, keyed on the same `<html>` state the CSS reads.
  const live = useSoundGateLive();

  /** The shutter fires on the press; it releases when the locale commits. */
  const press = () => {
    if (live) play('shutter-fire');
  };

  const flip = () => {
    if (busy.current) return;
    busy.current = true;
    const next = LOCALES[(LOCALES.indexOf(locale) + 1) % LOCALES.length]!;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const commit = () => {
      if (live) play('shutter-release', { gain: 0.8 });
      setStops((s) => s + 1);
      void setLocale(next);
      busy.current = false;
    };
    if (reduce) {
      commit();
      return;
    }
    // The commit lands a beat after press so the iris visibly steps, not just snaps.
    window.setTimeout(commit, 160);
  };

  return (
    <>
      <button
        type="button"
        aria-label={m.locale_next_label()}
        data-shutter
        suppressHydrationWarning
        onPointerDown={press}
        onClick={flip}
        className={cn(
          'group fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full',
          'bg-linear-to-b from-chassis to-chassis-lo ring-1 ring-white/15 shadow-key outline-none',
          'transition-[box-shadow,opacity] duration-[60ms] ease-(--ease-key) active:shadow-key-down',
          'focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-chassis-lo focus-visible:ring-white',
          '[html[data-overlay-open]_&]:pointer-events-none [html[data-overlay-open]_&]:opacity-30',
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            'relative block size-11 overflow-hidden rounded-full bg-chassis-lo ring-1 ring-black/15',
            'shadow-[inset_0_1px_1px_rgb(255_255_255/0.7),inset_0_-2px_3px_rgb(0_0_0/0.25)]',
            'transition-transform duration-[60ms] ease-(--ease-key) group-active:translate-y-px',
            'motion-reduce:transition-none motion-reduce:group-active:translate-y-0',
          )}
        >
          <span
            data-shutter-iris
            className={cn(
              'absolute inset-0 transition-transform duration-[60ms] ease-(--ease-key) group-active:rotate-30',
              'motion-reduce:transition-none motion-reduce:group-active:rotate-0',
            )}
            style={{ transform: `rotate(${stops * STEP_DEG}deg)` }}
          >
            {BLADES.map((i) => (
              <Blade key={i} index={i} />
            ))}
          </span>
          <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" />
        </span>
      </button>
      {/* Sighted feedback of the locale lives on the nav chip; this only speaks the change. */}
      <p aria-live="polite" className="sr-only">
        {m.language_label()}: {LOCALE_NAMES[locale]}
      </p>
    </>
  );
}

/** Fixed bottom-right camera-shutter locale control. Mounted once from `Base.astro`. */
export function ShutterButtonIsland() {
  return (
    <Providers>
      <Shutter />
    </Providers>
  );
}
