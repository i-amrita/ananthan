# Sound

The landing plays short UI sounds (shutter, slider detents, panel transitions) from one
pre-decoded sprite. This piece is the engine and the preload gate; the slider and shutter wire
their triggers separately.

## What ships

| File | Role |
|---|---|
| `public/audio/sprite.mp3` (+ `.ogg`) | the whole soundscape: seven synthesized slices, ~23 KB / ~19 KB |
| `src/lib/sound/sprite.ts` | generated manifest: name -> `[start, duration]` in seconds |
| `src/lib/sound/engine.ts` | the shared `AudioContext`, decode-once buffer, `play()`, mute state |
| `src/lib/sound/gate.ts` | the preload gate: `html[data-sound-ready]`, the `sound:ready` event, `onSoundReady(cb)` |
| `src/lib/sound/use-sound-ready.ts` | `useSoundReady()` for React islands |
| `src/lib/sound/global.ts` | installs `window.sound` (the Astro-side slider script uses it) |
| `scripts/build-sound-sprite.ts` | regenerates the sprite pair and the manifest (`pnpm sound:build`) |

## Sourcing: synthesized, not sampled

Every slice is rendered offline from ffmpeg lavfi sources (`sine`, `anoisesrc`, `aevalsrc`
envelopes) with fixed noise seeds. Nothing is sampled, so nothing carries a third-party license
and the NOTICE needs no audio attribution. The owner's cited YouTube sounds were rejected: a
"No copyright" title is a claim, not a license, and ripped streams are untraceable recordings.

The plan's Freesound/Kenney CC0 alternatives remain an option if a synthesized slice reads
wrong on audition; anything downloaded must carry a verified CC0 badge and a NOTICE entry
before it ships. `scripts/build-sound-sprite.ts` is the single regeneration path either way.

| Slice | Length | Fires on (wired next session) |
|---|---|---|
| `slider-detent` | 60 ms | focus slider crossing a snap breakpoint |
| `slider-settle` | 110 ms | slider snapping to its stop |
| `shutter-fire` | 330 ms | shutter button open / panel open (two-stage click-clack) |
| `shutter-release` | 180 ms | panel close (softer tail) |
| `locale-commit` | 115 ms | locale committed on the shutter |
| `panel-open` | 320 ms | drawer open whoosh |
| `panel-close` | 90 ms | drawer close tick |

## Engine rules

- One `AudioContext`, created lazily on the first user gesture (`pointerdown`, `touchend`,
  `mousedown`, `keydown`, capture + passive; never `touchstart`, which iOS does not count as
  activation). Constructing the context at hydration cost ~190 ms of main thread in the
  previous engine.
- The sprite is decoded once through an `OfflineAudioContext` (no gesture needed); browsers
  without it decode on the realtime context. The buffer plays on any context, resampled.
- `play(name, { rate, gain, offset })` drops rather than queues when the buffer is missing or
  the context is locked, so there is never a burst of late clicks. It never throws.
- The context can play when `running`, or when a gesture asked for a resume within 120 ms
  (sources queued on a suspended context start the moment it runs, keeping the first press
  audible). The unlock listeners stay armed for the page's life.
- iOS: `navigator.audioSession = 'playback'` is set best-effort inside the gesture.

## Mute

Precedence: an explicit choice made in this page load, then `?mute=1`, then the stored
preference (`localStorage['sound-muted']`). So:

- `?mute=1` silences the site for that load; nothing else can override it in that load unless
  the user toggles the mute control.
- A toggle (`window.sound.setMuted(false|true)`) persists and wins on later visits.
- The state is reflected on `<html data-sound-muted>`, so CSS can dim a toggle without JS.
- `prefers-reduced-motion` does not gate sound: sound is not motion. Only mute gates it.

## Preload gate

```
load ──fetch sprite──► decode once ──► data-sound-ready=""          (sounds play)
          │                     │
          └── fetch/decode error┴──► data-sound-ready="failed"   (site stays usable, silent)
                                     plus a 6 s timeout to the same place
```

- `html[data-sound-ready]`: absent while loading, `""` when ready, `"failed"` on failure.
- A `sound:ready` `CustomEvent` fires once on `window`, `{ detail: { status } }`, on failure too.
- `onSoundReady(cb)` (vanilla/Astro) and `useSoundReady()` (React) resolve with
  `'ready' | 'failed'` and never hang: the timeout guarantees a terminal state.
- `SoundGate.astro` (mounted in `Base.astro`) arms the gate with a bundled module script, so
  the fetch starts before first paint.
- `window.sound` (`play`, `onSoundReady`, `getStatus`, `isDecoded`, `isMuted`, `mutedByUrl`,
  `setMuted`) is the handle for plain Astro scripts and for the e2e suite.

A UI that must wait for sound (the landing holds the shutter and slider until the gate flips)
tests `html[data-sound-ready]` or subscribes to the gate; it never tests `AudioContext` itself.

## Dev bench

`/dev/sound-test` exists only in the dev server (`getStaticPaths()` returns nothing in the
production build, so no route ships; the sitemap filter drops `/dev/` either way; the page
carries `noindex, nofollow`). It has one button per slice, a mute toggle and the live gate
badge, so the owner can audition every slice.

## Regenerate the sprite

`pnpm sound:build` re-renders every slice from the lavfi graphs in
`scripts/build-sound-sprite.ts`, checks per-slice loudness (fails on silence), repacks with
fixed 120 ms gaps, re-encodes both files, rewrites `src/lib/sound/sprite.ts` and prints the
new `SPRITE_HASH`. Builds are byte-reproducible (`anoisesrc` seeds are fixed). Slice starts in
the encoded mp3 were verified sample-accurate against the manifest after decode.

Keep the sprite small: it is ~43 KB across both formats, well under the ~150 KB budget.

## Caching

`public/_headers` serves `/audio/*` as `public, max-age=31536000, immutable`, so the sprite
URL must carry a version stamp: it is `/audio/sprite.mp3?v=<SPRITE_HASH>`, and `SPRITE_HASH`
changes when the sprite is regenerated. `SPRITE_HASH` is an FNV-1a digest of the mp3 bytes,
which are byte-reproducible across rebuilds. The ogg container is not (its bitstream serial is
random), which is why the digest covers the mp3 only: the two files always carry the same
decoded audio, and the mp3 is the format the URL actually serves on most browsers.

## e2e

`tests/e2e/sound-gate.spec.ts` covers: the gate flips to ready, exactly one `sound:ready`
event, `?mute=1` sets `data-sound-muted` and suppresses playback (buffer-source counting on a
patched `AudioContext`), the unmuted page plays, an aborted sprite flips the gate to `failed`
while the page stays usable, the stored preference survives a reload, and the `window.sound`
API. All run against the static preview.
