# Screen: shutter locale button (P-shutter)

> Spec: `.agents/plans/2026-10-30-ananthan-site-revision.md` section "Shutter button (locale switch)". Sound is out of scope for this piece.

```
375x812
┌─────────────────────────┐
│                         │
│   page / hero photo     │
│                         │
│  ruler (bottom-centre)  │
│ ───────────▼──────  (◉) │  shutter: fixed bottom-4 right-4, 56px barrel, 44px iris cap
└─────────────────────────┘
```

## Behaviour

- Fixed `bottom-4 right-4` (safe-area aware), `z-40`. Bottom-right corner is reserved; the slider ruler stays bottom-centre and clear of it.
- Barrel: round chassis gradient ring, `ring-1 ring-white/15`, key shadow. Cap: 44px six-blade iris over a surface gradient disc with an inset highlight.
- Press: blades rotate ~30deg and the cap drops 1px while the shadow collapses (60ms). `motion-reduce` disables both.
- Tap opens the locale popover (same options and `?locale=` write as the nav chip). Picking a locale runs a blade blink (clip-path close then open) on the popover, the locale changes at the midpoint.
- Only one locale popover is open at a time (shutter and nav chip close each other).
- While `html[data-overlay-open]` is set the button is dimmed and `pointer-events-none`.
- A11y: `aria-label` from `locale_switch_label`, `aria-expanded`, visible focus ring.

## Captures

375x812 first, then 768x1024, 1280x800; light and dark; over the home photo and a paper page; rest, pressed, popover open.
