# Screen: shutter locale button (P-shutter)

> v3: the iris cap carries the selected locale as a rotating aperture-ring label. Locales are `en ms hi es ml` (German dropped, Spanish added, owner steer 2026-11-02 items 5 and 6). Sound stays out of scope for this piece.

```
375x812
┌─────────────────────────┐
│                         │
│   page / hero photo     │
│                         │
│  ruler (bottom-centre)  │
│ ───────────▼────── (◉)  │  shutter: fixed, 56px barrel, 44px iris cap
│                    [ES] │  locale code sits on the iris as a small upright label
└─────────────────────────┘
```

## Locale ring

- The iris cap centre shows the current locale code (`EN`, `MS`, `HI`, `ES`, `ML`) as a small uppercase mono label over the blades.
- The label sits on an aperture ring that rotates in like a dial: on a locale change the ring spins 72deg per step (5 stops, one per locale, deterministic from the locale index) with a spring ease. The outgoing code rotates out with the ring while the incoming code rotates in, and the text always rests upright (a counter-rotation on the text span cancels the ring angle).
- `prefers-reduced-motion`: no rotation, the code swaps instantly.

## Behaviour

- Fixed bottom-right (safe-area aware), `z-40`; lifted above the focus ruler on the home route. Bottom-right corner is reserved; the slider ruler stays bottom-centre and clear of it.
- Barrel: round chassis gradient ring, `ring-1 ring-white/15`, key shadow. Cap: 44px six-blade iris over a surface gradient disc with an inset highlight.
- Press: blades rotate ~30deg and the cap drops 1px while the shadow collapses (60ms). `motion-reduce` disables both.
- Tap opens the locale popover (same options and `?locale=` write as the nav chip). Picking a locale runs a blade blink (clip-path close then open) on the popover, the locale changes at the midpoint.
- Only one locale popover is open at a time (shutter and nav chip close each other); both reflect the same `?locale=` value, so picking in the nav chip also spins the shutter ring.
- While `html[data-overlay-open]` is set the button is dimmed and `pointer-events-none`.
- A11y: `aria-label` from `locale_switch_label` plus the current code, `aria-expanded`, visible focus ring. The label is `aria-hidden` (the button label carries the code).

## Captures

375x812 first, then 768x1024, 1280x800; light and dark; rest, popover open, mid-spin after picking a locale.
