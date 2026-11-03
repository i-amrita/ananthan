import { useRef, useState } from 'react';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LOCALE_NAMES, LOCALES, m, useLocale } from '@/lib/i18n';
import { play } from '@/lib/sound';
import { useSoundGateLive } from '@/lib/sound/use-sound-gate';
import { cn } from '@/lib/utils';

import { useExclusiveOpen } from './LocaleSwitch';
import { Providers } from './Providers';

const BLADES = [0, 1, 2, 3, 4, 5] as const;
/** Half of the blink keyframe: the locale flips while the popover is closed to a point. */
const BLINK_MS = 320;

/**
 * Aperture dial: 72deg per locale stop, so the ring travels one full turn across the five locales.
 * The text counter-rotates by the same angle, so the code always reads upright at rest.
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
  const [open, setOpen] = useExclusiveOpen();
  const [blink, setBlink] = useState(false);
  const timers = useRef<number[]>([]);
  // The gate: the shutter stays silent while the sprite loads. `live` is true once the sprite
  // is decoded or has failed (the site works without sound), or the site is muted (a muted site
  // never waits for the sprite). The hold itself (`inert`, `aria-disabled`, the skeleton look)
  // is not React's job: the DOM gate in `sound/gate-dom.ts` owns those attributes, keyed on the
  // same `<html>` state the CSS reads, so a React flush lag cannot strand the control inert.
  const live = useSoundGateLive();

  const code = locale.toUpperCase();
  const angle = LOCALES.indexOf(locale) * STEP_DEG;

  /** The shutter fires on the press; it releases on the gesture or on the commit. */
  const press = () => {
    if (live) play('shutter-fire');
  };

  const release = () => {
    if (live) play('shutter-release', { gain: 0.8 });
  };

  const choose = (next: (typeof LOCALES)[number]) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      if (live) play('shutter-release');
      void setLocale(next);
      setOpen(false);
      return;
    }
    setBlink(true);
    timers.current.push(
      // The commit sound lands with the locale change at the blink midpoint, so the blades and
      // the sound close together.
      window.setTimeout(() => {
        if (live) play('shutter-release');
        void setLocale(next);
      }, BLINK_MS / 2),
      window.setTimeout(() => {
        setBlink(false);
        setOpen(false);
      }, BLINK_MS),
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${code} ${m.locale_switch_label()}`}
          data-shutter
          onPointerDown={press}
          onPointerUp={release}
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
                'group-data-[state=open]:rotate-12 motion-reduce:transition-none motion-reduce:group-active:rotate-0 motion-reduce:group-data-[state=open]:rotate-0',
              )}
            >
              {BLADES.map((i) => (
                <Blade key={i} index={i} />
              ))}
            </span>
            {/* Aperture ring: carries the locale code one stop (72deg) per locale. The text
                counter-rotates, so the code rests upright; the label is decorative because the
                button's accessible name already carries the code. */}
            <span
              data-locale-ring
              className="absolute inset-0 transition-transform duration-500 ease-(--ease-spring) motion-reduce:transition-none"
              style={{ transform: `rotate(${angle}deg)` }}
            >
              <span
                className="absolute inset-0 grid place-items-center"
                style={{ transform: `rotate(${-angle}deg)` }}
              >
                <span className="rounded-full bg-chassis-lo/85 px-1 font-mono text-[9px] font-semibold tracking-widest text-white/90 ring-1 ring-white/25">
                  {code}
                </span>
              </span>
            </span>
            <span className="absolute inset-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)]" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className={cn(
          'w-48 border-0 p-1 shadow-lg ring-0 origin-bottom-right',
          blink && 'animate-[shutter-blink_320ms_var(--ease-key)_both] motion-reduce:animate-none',
        )}
      >
        <ul role="listbox" aria-label={m.locale_switch_label()} className="flex flex-col">
          {LOCALES.map((next) => (
            <li key={next} role="option" aria-selected={next === locale}>
              <button
                type="button"
                lang={next}
                onClick={() => choose(next)}
                className={cn(
                  'w-full rounded-sm px-2 py-2.5 text-left text-sm hover:bg-accent hover:text-accent-foreground',
                  next === locale && 'bg-accent font-medium text-accent-foreground',
                )}
              >
                {LOCALE_NAMES[next]}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
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
