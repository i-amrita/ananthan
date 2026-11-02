# Screen: sound engine + preload gate

> Spec: `.agents/plans/2026-10-30-ananthan-site-revision.md` section "Sound design", steer item 1.
> Scope of this piece: engine and preload gate only. No slider/shutter wiring (next session).

## What ships

- One sprite file, `public/audio/sprite.mp3` (+ `public/audio/sprite.ogg` fallback), synthesized
  offline with ffmpeg. Target < 150 KB.
- Seven named slices, packed in this order, each separated by 120 ms of silence:

| # | Slice | Length | Description |
|---|---|---|---|
| 1 | `slider-detent` | ~60 ms | Focus-ruler detent tick. Short, dry, mid-high click. |
| 2 | `slider-settle` | ~110 ms | Slider snapping to its stop. Slightly lower, longer tail. |
| 3 | `shutter-fire` | ~400 ms | Two-stage mechanical click-clack (blade open, then close). |
| 4 | `shutter-release` | ~180 ms | Softer release tail, no second clack. |
| 5 | `locale-commit` | ~120 ms | Commit click for the locale shutter. Distinct pitch from the detent. |
| 6 | `panel-open` | ~320 ms | Whoosh for the drawer opening (filtered noise swell). |
| 7 | `panel-close` | ~90 ms | Dry tick that lands the drawer closing. |

- `src/lib/sound/sprite.ts` holds the map (name -> start/duration in seconds) and the sprite URL.
- `src/lib/sound/engine.ts` owns the single `AudioContext`, the decode-once buffer cache and
  `play(name, { rate, gain })`.
- `src/lib/sound/gate.ts` owns the readiness signal: `html[data-sound-ready]` (`""` when decoded,
  `"failed"` when the fetch/decode failed or the 6 s timeout hit) plus a `sound:ready` DOM event.

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

`/sound-test` is dev-only (`import.meta.env.DEV`), excluded from the sitemap and `noindex`. It
lists one button per slice, plus a mute toggle and the live gate status. The owner can audition
every slice without touching the landing UI.

```
375x812
┌─────────────────────────┐
│ Sound test      [ready] │
├─────────────────────────┤
│ ▸ slider-detent         │
│ ▸ slider-settle         │
│ ▸ shutter-fire          │
│ ▸ shutter-release       │
│ ▸ locale-commit         │
│ ▸ panel-open            │
│ ▸ panel-close           │
│                         │
│ [ mute ]                │
└─────────────────────────┘
```

## Captures

375x812 first, then 768x1024 and 1280x800; light and dark. The dev page is a plain list, so the
captures check typography, spacing and the gate badge only.
