import { useCallback, useEffect, useState } from 'react';

import { isMuted, play, setMuted, type SoundName } from '@/lib/sound';
import { SOUND_NAMES } from '@/lib/sound/sprite';
import { useSoundReady } from '@/lib/sound/use-sound-ready';

import { Providers } from './Providers';

const LABELS: Record<SoundName, string> = {
  'slider-detent': 'slider detent tick',
  'slider-settle': 'slider settle click',
  'shutter-fire': 'shutter fire (click-clack)',
  'shutter-release': 'shutter release',
  'locale-commit': 'locale commit',
  'panel-open': 'panel open whoosh',
  'panel-close': 'panel close tick',
};

/** Each slice gets its own playback rate, so the owner can judge the pitch in isolation. */
const RATES: Record<SoundName, number> = {
  'slider-detent': 1,
  'slider-settle': 1,
  'shutter-fire': 1,
  'shutter-release': 1,
  'locale-commit': 1,
  'panel-open': 1,
  'panel-close': 1,
};

/**
 * Dev-only sound bench. One button per sprite slice, a mute toggle and the live gate status.
 * Not shipped: the page only exists in the dev server.
 */
function SoundTest() {
  const status = useSoundReady();
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, [status]);

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }, [muted]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono text-xs tracking-widest uppercase">Gate</span>
        <span
          data-sound-status={status}
          className="rounded-key bg-surface-muted px-2 py-1 font-mono text-xs"
        >
          {status}
        </span>
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={muted}
          className="rounded-key border border-border px-3 py-1 font-mono text-xs uppercase transition-colors hover:bg-surface-muted"
        >
          {muted ? 'muted' : 'sound on'}
        </button>
      </div>

      <ul className="flex flex-col divide-y divide-border border-y border-border">
        {SOUND_NAMES.map((name) => (
          <li key={name}>
            <button
              type="button"
              data-sound-slice={name}
              onClick={() => play(name, { rate: RATES[name] })}
              className="flex w-full items-center justify-between gap-4 px-1 py-3 text-left transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              <span className="font-mono text-sm">{name}</span>
              <span className="text-xs text-muted-foreground">{LABELS[name]}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="text-xs text-muted-foreground">
        Playback needs a user gesture in every browser: the first click above unlocks the audio
        context. Append <code className="font-mono">?mute=1</code> to the URL to force silence.
      </p>
    </div>
  );
}

export function SoundTestIsland() {
  return (
    <Providers>
      <SoundTest />
    </Providers>
  );
}
