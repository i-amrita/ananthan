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
- The settle plays when the movement stops and the position rests on a stop (within 6% of a
  whole stop, the gap a snap can leave). It plays once per stop reached, so scrubbing back and
  forth lands audibly.
- The settle is the landing of a detent and never sounds on its own, so the order is always
  detent first, settle second. Resting on the baseline stop after arming is not a landing: the
  arming is not a crossing, so nothing plays.
- The baseline is the stop the page settled on, not the stop the control rests on when the user
  grabs it. The browser applies the scroll delta before the wheel event reaches the script, so
  a baseline taken at grab time would swallow the first wheel tick.
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
- The parts CSS cannot express (`inert`, `aria-disabled`) come from a DOM module
  (`src/lib/sound/gate-dom.ts`) that reads the same `<html>` attribute. It is deliberately not
  React: React drops an `inert` attribute it did not render, so a re-render would silently
  re-enable a held control, and a flush that lags the attribute would strand it inert. The gate
  owns the attributes; React only reads the state.
- The drawer overlay marks the track it freezes (`data-overlay-held`), because the two features
  share the `inert` attribute: the gate leaves the attribute alone while the overlay is the one
  holding the track.
- A safety net in the layout head flips the gate to `failed` after 7 s if the sound bundle never
  ran, so the controls can never stay dead for the life of the page.
- `data-sound-armed` is set by the pre-paint inline script, so the CSS only holds anything when
  JavaScript actually ran. Without JavaScript nothing is held and the track stays a plain scroll
  container with real links.
- No live-region announcement: "sound is ready" is not information a screen reader user needs,
  and it would be noise on every page load. The controls simply become available.

### Skeleton

Minimal, token-based, no layout shift:

- Ruler: the tick strip drops its minor ticks and the needle disappears, the labels dim to the
  muted token. The geometry does not move.
- Shutter: the iris cap becomes a plain muted disc (same 44px): the blades and the locale ring
  are hidden, so the cap reads as one blank disc. The barrel keeps its shape.

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
Files: `/tmp/ananthan-v3-wire2/evidence/`.

## e2e

`tests/e2e/sound-wiring.spec.ts`:

- the loading state holds the slider and the shutter (`inert`, `aria-disabled`, no pointer events)
- the ready state releases them
- a failed sprite releases them
- `?mute=1` releases them immediately, even while the sprite is still loading
- the held controls are out of the tab order
- the slider ticks (`slider-detent`) and settles (`slider-settle`) on a stop crossing, over a
  drag, a wheel, the keyboard and a tap on a ruler stop
- the detent always comes before the settle
- the load and the URL restore stay silent
- the shutter fires (`shutter-fire`) on press and releases (`shutter-release`) on the commit
- a muted site stays silent but still works

The engine exposes the call log (`window.sound.calls()`), so the specs assert the requested slice
without touching `AudioContext`.

Existing specs that drive the track or the shutter wait for the gate first: the controls are
intentionally inert until the sprite is decoded.
