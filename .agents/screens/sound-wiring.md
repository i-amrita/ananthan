# Screen: sound wiring on the landing (slider + shutter)

> Steer item 1 of `.agents/plans/2026-11-02-ananthan-v3-steer.md`: the landing holds the focus
> slider and the shutter until the sound sprite is decoded, and both controls make sound.
> Engine contract: `.agents/docs/sound.md`. Sprite: `src/lib/sound/sprite.ts` (four slices).
> Plan: `.agents/plans/2026-10-30-ananthan-site-revision.md`, section "Where each sound fires".

## Scope

Only two controls make sound: the focus slider (ruler + track) and the shutter button. The nav
chip, the theme toggle, the drawers and the locale list stay silent (owner decision, 2026-11-02:
panels get motion only).

| Slice | Fires on |
|---|---|
| `slider-detent` | the focus crosses a stop (drag, wheel, keyboard, tap on a stop) |
| `slider-settle` | the gesture settles on a stop |
| `shutter-fire` | the shutter button is pressed (`pointerdown`) |
| `shutter-release` | the button is released, or the locale choice commits |

## Slider

- One detent per stop crossing: the focused stop changes, so a drag from 01 to 02 ticks once, not
  once per frame. The first focus of a page load is the baseline and never ticks.
- Rate limit: at most one detent every 60 ms, so a fast drag cannot machine-gun the tick.
- The settle plays when the movement stops and the position rests on a stop (within 2% of a
  whole stop). It plays once per stop reached, so scrubbing back and forth lands audibly.
- Never on load and never on a programmatic restore (`?panel=2`): the sound is armed by the first
  real gesture on the slider (pointer, key or wheel), and nothing before that counts.
- The same code path serves the drag, the ruler drag, the wheel / scroll-snap, the arrow keys and
  a tap on a ruler stop: they all move the track, and the track is what makes the sound.

## Shutter

- `shutter-fire` on `pointerdown` (the blades open under the finger).
- `shutter-release` when the button is released, and again when the locale choice commits. The
  commit sound is aligned with the blink: it lands at the blink midpoint, the instant the locale
  actually changes, so the blades and the sound close together.
- Under reduced motion there is no blink: the locale swaps instantly and the release lands with it.

## Gate

```
load ──fetch sprite──► decode once ──► data-sound-ready=""          (controls live, sound plays)
   │                    │
   └── fetch/decode error┴──► data-sound-ready="failed"            (controls live, silent)
```

- The focus slider and the shutter are held while the sprite is loading: `inert`,
  `aria-disabled="true"` and no pointer events.
- `?mute=1` (or the stored mute preference) never waits: the controls are live immediately and
  stay silent. A failed sprite also releases the controls: the site works without sound.
- The hold is CSS keyed on `<html>`, so it is correct before hydration and never flashes:
  `html[data-sound-armed]:not([data-sound-ready]):not([data-sound-muted])`.
- `data-sound-armed` is set by the pre-paint inline script, so the CSS only holds anything when
  JavaScript actually ran. Without JavaScript nothing is held and the track stays a plain scroll
  container with real links.
- No live-region announcement: "sound is ready" is not information a screen reader user needs,
  and it would be noise on every page load. The controls simply become available.

### Skeleton

Minimal, token-based, no layout shift:

- Ruler: the tick strip drops its minor ticks and the needle disappears, the labels dim to the
  muted token. The geometry does not move.
- Shutter: the iris cap becomes a plain muted disc (same 44px). The barrel keeps its shape.

The shutter skeleton breathes at most once per 1.4 s and only under
`prefers-reduced-motion: no-preference`; under reduced motion it is a static disc.

```
375x812, loading                     375x812, ready
┌─────────────────────────┐         ┌─────────────────────────┐
│                         │         │                         │
│  01 / 04                │         │  01 / 04                │
│  ANANTHAN NAMBIAR       │         │  ANANTHAN NAMBIAR       │
│                         │         │                         │
│                         │         │                         │
│ ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁  │         │ ─┬──┬──┬▼─┬──┬──┬──┬── │
│      (no needle)        │         │  02 RESEARCH            │
│                    ◯    │         │                    ◉    │
└─────────────────────────┘         └─────────────────────────┘
  ruler: dimmed, no needle             ruler: live, needle on the stop
  shutter: blank muted cap             shutter: iris with the locale code
```

## Captures

375x812 and 1280x800, light and dark: the loading state (sprite delayed) and the ready state.
Files: `/tmp/ananthan-v3-wire/evidence/`.

## e2e

`tests/e2e/sound-wiring.spec.ts`:

- the loading state holds the slider and the shutter (`inert`, `aria-disabled`, no pointer events)
- the ready state releases them
- a failed sprite releases them
- `?mute=1` releases them immediately, even while the sprite is still loading
- the slider ticks (`slider-detent`) and settles (`slider-settle`) on a stop crossing
- the shutter fires (`shutter-fire`) on press and releases (`shutter-release`) on the commit

The engine exposes the call log (`window.sound.calls()`), so the specs assert the requested slice
without touching `AudioContext`.

Existing specs that drive the track or the shutter wait for the gate first: the controls are
intentionally inert until the sprite is decoded.
