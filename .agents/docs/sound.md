# Sound

The landing plays short UI sounds (shutter, slider detents, slider settle) from one pre-decoded
sprite. This piece is the engine and the preload gate; the slider and shutter wire their triggers
separately.

## What ships

| File | Role |
|---|---|
| `public/audio/sprite.mp3` (+ `.ogg`) | the whole soundscape: four slices cut from the owner's licensed Stable Audio tracks, ~14 KB / ~17 KB |
| `src/lib/sound/sprite.ts` | generated manifest: name -> `[start, duration]` in seconds, plus `SPRITE_HASH` |
| `src/lib/sound/engine.ts` | the shared `AudioContext`, decode-once buffer, `play()`, mute state |
| `src/lib/sound/gate.ts` | the preload gate: `html[data-sound-ready]`, the `sound:ready` event, `onSoundReady(cb)` |
| `src/lib/sound/use-sound-ready.ts` | `useSoundReady()` for React islands |
| `src/lib/sound/global.ts` | installs `window.sound` (the Astro-side slider script uses it) |
| `scripts/build-sound-sprite.ts` | regenerates the sprite pair and the manifest (`pnpm sound:build`) |

## Sourcing: the owner's own Stable Audio recordings

The slices are **sampled**, not synthesized. The owner bought Stable Audio 3 tracks from Brioso
(`quino@usebrioso.com`, orders 78834404 and c6142acc) and the sprite is built from trimmed
windows of those FLAC masters. As of 2026-11-02 the sprite uses two of them: `slider-1`
(order c6142acc, track 1) for both slider slices, and the shutter masters for the shutter
slices. `slider-0` and `slider-2` are unused.

The licence (per track, `*-license.pdf`) grants a worldwide, perpetual, **commercial** licence to
use, reproduce, distribute, publicly perform, synchronise, **modify** and create derivative works,
with **no attribution required**. It restricts one thing: the track may **not** be resold,
redistributed or licensed **on its own as a stand-alone audio file, sound pack or music library**.
It must be used as part of a larger creative work. It also may not be registered with a
content-identification system.

Consequences for this repo:

- The sprite is a **derivative embedded in the site** (a larger creative work). That is the
  licensed use.
- Only the packed sprite is committed. The trimmed source slices live in `assets/sound-src/`,
  which is **gitignored**, and the build reads the licensed masters from `SOUND_SRC`
  (default `/tmp/ananthan-sounds`). Nothing in the repository is a stand-alone redistribution of
  the track.
- If the repository ever goes public, `assets/sound-src/` must stay ignored. The `.gitignore`
  entry is the guard; the build script also refuses to run when the source directory is missing.
- `NOTICE` records the licence terms. No attribution is required, but the licence and the
  restriction are documented so nobody re-shares the slices by accident.

## The four slices

| Slice | Length | Source window | Fires on |
|---|---|---|---|
| `slider-detent` | 60 ms | slider-1 `1.655-1.715s` | focus slider crossing a snap breakpoint |
| `slider-settle` | 250 ms | slider-1 `3.435-3.685s` | slider snapping to its stop |
| `shutter-fire` | 220 ms | shutter-1 `3.48-3.70s` | shutter button open / panel open |
| `shutter-release` | 230 ms | shutter-0 `3.49-3.72s` | panel close (softer tail) |

Both slider slices now come from **one** source clip, `slider-1` (order `c6142acc`, track 1). The
earlier `slider-0` and `slider-2` masters are **no longer used** and are not referenced by the
build script, the manifest or any caller.

The owner dropped the `locale-commit`, `panel-open` and `panel-close` slices: the panels get motion
only, no sound. Those names no longer exist in the manifest, the build script or any caller.

### How the windows were chosen

Every non-silent window of the five masters was profiled with `ffmpeg silencedetect -38dB d=0.08`
(12 windows found across the set; slider-1 alone has five non-silent windows). Windows were
re-profiled for this change with `astats` peak per 5 ms bin over slider-1. The four chosen
windows and the numbers behind them:

| Window | Peak | RMS | Centroid | Flatness | Read |
|---|---|---|---|---|---|
| slider-1 `1.655-1.715` | -14.1 dB | -32.9 dB | (impulsive) | (impulsive) | The only isolated transient in the whole slider-1 clip: a floor of about -60 dB, then a single ~12 ms click peaking at -18 dB (bin peak) at 1.675-1.685 s, then straight back to the floor. Cleanest possible detent: no drone, no swell, no tail. The window keeps a few ms of lead and tail so the 3 ms fades have room. |
| slider-1 `3.435-3.685` | -13.2 dB | -32.3 dB | (broadband hit) | (broadband hit) | A harder impact at 3.440-3.465 s (bin peak -16 dB) followed by a decaying tail through 3.62 s and silence by 3.69 s. The tail is what makes it read as a landing, and it is clearly a different event shape from the detent click. |
| shutter-1 `3.48-3.70` | -2.5 dB | -25.8 dB | 5182 Hz | 0.070 | Sharpest click of the whole set: mirror slap at 3.54 s (-5.5 dB), curtain close at 3.61 s (-2.5 dB). Lowest centroid = the dullest, most mechanical of the candidates. |
| shutter-0 `3.49-3.72` | -5.9 dB | -25.4 dB | 5396 Hz | 0.154 | Softer second click, peak never above -5.9 dB and no -2.5 dB transient, so it reads as a release and not as a second fire. |

Rejected, with the reason:

- slider-1 `0.35-0.94` and `2.12-2.98`: long swells with a -25 dB floor and a rising tail; too
  "whoosh" for a detent, and the onset is not a click.
- slider-1 `3.37-4.38` as a whole: 1 s long and a continuous 1 kHz-ish drone (centroid 6090 Hz,
  -24 dB floor) rather than a transient. Only its first 250 ms, the impact and its decaying tail,
  is usable, and that is what `slider-settle` is.
- slider-1 `2.95-3.03`: a loud isolated hit (-12 dB) but it sits at the end of the 2.12-2.98 swell
  and has no tail, so it would read as a second detent rather than a landing.
- slider-0 and slider-2: no longer used at all. Both slider slices come from slider-1.
- shutter-0 `0.18-0.39` and `1.50-1.70`: a single soft click with a -23 dB tail, but no two-stage
  action, so the shutter would read as one tap rather than fire-and-release.
- shutter-1 `1.48-1.77` and `2.14-2.46`: same shape as `3.50-3.80` but 2-3 dB quieter.

### Level

Each slice is trimmed, monoed, high-passed at 120 Hz, given 5 ms in/out fades and then normalised
to about **-16 LUFS momentary** with the true peak capped at -1 dBFS, so the four slices sit at
the same level and nothing clips. A short transient has no meaningful BS.1770 integrated
loudness, so the build derives the gain from the momentary RMS of the loudest frame (a +3 dB
empirical offset for the mostly-silent windows) and then caps it against the true peak. Measured
after the build:

| Slice | RMS | Peak |
|---|---|---|
| `slider-detent` | -19.7 dBFS | -1.0 dBFS |
| `slider-settle` | -19.0 dBFS | -2.4 dBFS |
| `shutter-fire` | -21.0 dBFS | -1.0 dBFS |
| `shutter-release` | -20.1 dBFS | -1.5 dBFS |

The detent plays on **every** stop crossing, so it is deliberately short (60 ms) and the source
click inside it is 12 ms, which keeps it from being fatiguing. The slice is high-passed at 120 Hz
like the others, so there is no sub-bass thump under the tick.

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

`pnpm sound:build` reads the licensed masters from `SOUND_SRC` (default `/tmp/ananthan-sounds`),
trims the four windows, normalises them, repacks with fixed 120 ms gaps, re-encodes both files,
rewrites `src/lib/sound/sprite.ts` and prints the new `SPRITE_HASH`. The trimmed FLAC slices are
written to `assets/sound-src/` (gitignored).

Rebuilds are byte-reproducible: the mp3 is deterministic and the ogg bitstream serial is pinned by
`pinOggSerial`. Slice starts in the encoded mp3 were verified sample-accurate against the manifest
after decode.

Keep the sprite small: it is ~31 KB across both formats, well under the ~150 KB budget.

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
