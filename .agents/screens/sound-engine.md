# Screen: sound engine + preload gate

> Spec: `.agents/plans/2026-10-30-ananthan-site-revision.md` section "Sound design", steer item 1.
> Scope: engine, preload gate and the sprite. The sprite holds the owner's own Stable Audio
> recordings (commercial licence, no attribution, no stand-alone redistribution), not synthesis.

## What ships

- One sprite file, `public/audio/sprite.mp3` (+ `public/audio/sprite.ogg` fallback), built by
  `pnpm sound:build` from trimmed FLAC slices of the owner's Stable Audio tracks. Target < 150 KB.
- Four named slices, packed in this order, each separated by 120 ms of silence:

| # | Slice | Length | Source window | Description |
|---|---|---|---|---|
| 1 | `slider-detent` | ~60 ms | slider-0 `3.415-3.475s` | Very short, bright tick for the focus ruler crossing a snap stop. |
| 2 | `slider-settle` | ~230 ms | slider-2 `3.37-3.60s` | Softer, lower landing for the slider snapping home. |
| 3 | `shutter-fire` | ~220 ms | shutter-1 `3.48-3.70s` | The sharpest click: mirror slap + curtain close. |
| 4 | `shutter-release` | ~230 ms | shutter-0 `3.49-3.72s` | A second, softer click: the release tail. |

- `src/lib/sound/sprite.ts` holds the map (name -> start/duration in seconds), `SPRITE_HASH` and the
  sprite URL. The engine API is unchanged.
- `src/lib/sound/engine.ts` owns the single `AudioContext`, the decode-once buffer cache and
  `play(name, { rate, gain })`.
- `src/lib/sound/gate.ts` owns the readiness signal: `html[data-sound-ready]` (`""` when decoded,
  `"failed"` when the fetch/decode failed or the 6 s timeout hit) plus a `sound:ready` DOM event.

## Slice selection (measured, not guessed)

Every candidate window was profiled with `ffmpeg silencedetect`, `astats` (peak/RMS per 5-40 ms
bin) and `aspectralstats` (centroid, flatness). Numbers live in `.agents/docs/sound.md`.

| Slice | Peak | RMS | Centroid | Why this one |
|---|---|---|---|---|
| `slider-detent` | -8.7 dB | -33.5 dB | 8.6 kHz | Only near-impulsive click in the slider set: a 40 ms spike at 3.455 s with a -24 dB floor before and after. Highest centroid of the slider candidates. |
| `slider-settle` | -7.5 dB | -27.7 dB | 8.1 kHz | Two-stage landing (3.44 s and 3.51 s) with a 100 ms soft tail, no hard click at the head. |
| `shutter-fire` | -2.5 dB | -25.8 dB | 5.2 kHz | Sharpest click in the shutter set (3.61 s, -2.5 dB) preceded by a mirror slap at 3.54 s. |
| `shutter-release` | -5.9 dB | -25.4 dB | 5.4 kHz | Softer second click, no peak above -5.9 dB, no -2.5 dB transient. |

All four are loudness-normalised to about -16 LUFS short-term and get 5 ms in/out fades, so
nothing clips and nothing clicks on slice boundaries.

## Preload gate

```
load ──► fetch /audio/sprite.mp3 ──► decode once ──► data-sound-ready=""  (sound usable)
   │            │                            │
   │            └──── fetch/decode error ────┼──► data-sound-ready="failed" (site stays usable, silent)
   │                                         └──► 6 s timeout ──► data-sound-ready="failed"
   └── html[data-sound-gate="pending"] until either terminal state
```

- The gate flips to a terminal state (decoded or failed) within ~6 s at the latest, so a UI that
  waits on it never hangs. A failed gate never blocks the page: it just means "stay silent".
- `useSoundReady()` (React) and `onSoundReady(cb)` (vanilla, Astro-friendly) both resolve with the
  same status: `'ready' | 'failed'`.
- The realtime `AudioContext` is created lazily on the first user gesture (`pointerdown`,
  `touchend`, `mousedown`, `keydown`, capture + passive). Nothing is queued before that, so a sound
  never plays late in a burst.

## Mute

- `?mute=1` in the URL mutes everything for that page load. It wins over the stored preference.
- The preference persists in `localStorage` under `sound-muted` (`"1"` / `"0"`).
- Muted state is written to `<html data-sound-muted>` so CSS can dim a sound toggle without JS.
- `prefers-reduced-motion` is unrelated to sound and does not gate it. Sound is gated on `?mute=1`
  and the stored preference only.

## Dev page

`/dev/sound-test` is dev-only, excluded from the sitemap and `noindex`. It lists one button per
slice, plus a mute toggle and the live gate status. The owner can audition every slice without
touching the landing UI.

```
375x812
┌─────────────────────────┐
│ Sound test      [ready] │
├─────────────────────────┤
│ ▸ slider-detent         │
│ ▸ slider-settle         │
│ ▸ shutter-fire          │
│ ▸ shutter-release       │
│                         │
│ [ mute ]                │
└─────────────────────────┘
```

## Captures

375x812 first, then 768x1024 and 1280x800; light and dark. The dev page is a plain list, so the
captures check typography, spacing and the gate badge only.
