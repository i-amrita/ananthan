# Screen: shutter locale button (P-shutter)

> v4: the shutter is a pure aperture. A tap flips to the next locale (wrap-around); no popover, no locale code on the iris. The current code lives only on the nav chip. Locales are `en ms hi es ml`. Sound stays wired: shutter-fire on press, shutter-release on the commit.

```
375x812
┌─────────────────────────┐
│                         │
│   page / hero photo     │
│                         │
│  ruler (bottom-centre)  │
│ ───────────▼────── (◉)  │  shutter: fixed, 56px barrel, 44px iris cap, blades only
└─────────────────────────┘
```

## Behaviour

- Fixed bottom-right (safe-area aware), `z-40`; lifted above the focus ruler on the home route. Bottom-right corner is reserved; the slider ruler stays bottom-centre and clear of it.
- Barrel: round chassis gradient ring, `ring-1 ring-white/15`, key shadow. Cap: 44px six-blade iris over a surface gradient disc with an inset highlight.
- Press: blades rotate ~30deg and the cap drops 1px while the shadow collapses (60ms). `motion-reduce` disables both.
- Tap flips to the next locale in the `LOCALES` list (`en → ms → hi → es → ml → en`). The iris rotates one stop (72deg) per flip with a spring ease; the commit (sound + `?locale=` write) lands a beat after the press. `prefers-reduced-motion`: no rotation, the flip commits immediately.
- No popover, no dropdown, no locale label or counter-rotating text on the iris: the shutter is a pure aperture icon.
- The current locale is shown only in the top navbar chip (`LocaleSwitchButton variant="code"`, mono lowercase code, aria-label `<CODE> Choose language`); it shows the code collapsed and expanded and opens the picker popover. A shutter flip updates the chip immediately via the shared `?locale=` state.
- A11y: the accessible name is `locale_next_label` ("Next language"); a visually hidden `aria-live="polite"` region announces `language_label: <native name>` after a flip. Visible focus ring. No `aria-expanded`.
- While `html[data-overlay-open]` is set the button is dimmed and `pointer-events-none`.

## Captures

375x812 first, then 768x1024, 1280x800; light and dark; rest and one stop after a tap.
