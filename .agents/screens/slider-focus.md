# Screen: home focus slider (P2)

> Spec: `.agents/plans/2026-10-30-ananthan-site-revision.md` sections "Navigation model" (Slider activation), "Slider visual target". References: `.agents/screens/references.md` (rare-squash first), crop `.agents/screens/references/rare-squash-hero-crop.png`. Drawer: `overlay-drawer.md`.

```
375x812
┌─────────────────────────┐
│ [chip, fixed top]       │
│                         │
│  full-bleed photograph  │  hard edge, no card, no gap
│  (scrim for legibility) │
│                         │
│  01 / 04                │  mono index
│  RESEARCH               │  large display title
│  one-sentence body      │
│                         │
│ 02 RESEARCH  03 LIFE    │  neighbour labels above the ruler
│  ●            ○         │  filled dot = focused
│ ─┬──┬──┬▼─┬──┬──┬──┬── │  ruler, red needle fixed at centre
│       0.5   0.7         │  numeric stops
│ FOCUS 0.50 M            │  live readout, route accent
└─────────────────────────┘
```

## Behaviour

- The dot indicator is removed. The focus-scale ruler replaces it: ticks, a needle with a triangle marker fixed at the centre, numeric stops, neighbour labels above, `FOCUS x.xx M` readout. The ruler scrolls under the needle as the track scrolls (transform driven by track `scrollLeft`, no layout). Mono type. Four stops map to the four panels: 0.30, 0.50, 0.70, 1.00 (text only, no fake EXIF).
- The readout value updates continuously while dragging and settles on the discrete stop of the nearest panel. The label of the focused panel is announced in an `aria-live="polite"` region.
- The index `01 / 04` and a progress bar track the focused panel. The bar is a 2px line at the bottom edge, filled to `(focused+1)/4`.
- Panels are full-bleed photographs with a legibility scrim, edge to edge, no rounded card, no border, no shadow, no gap. The depth-of-field blur on non-focused neighbours stays (real `filter: blur`, GPU composited), viewfinder corner brackets stay on the focused panel.
- Activation: tap or click on the FOCUSED panel (pointer moved <6px and <250ms) pushes `overlay=<route>` (research, life, photography). A tap on a non-focused panel focuses it without opening. `Enter` or `Space` on the track opens the focused panel. The Intro panel has no page: activating it advances to panel 1 and its CTA text becomes `hero_enter`. Flick or drag release settles on the nearest panel and must not open anything.
- While an overlay is open the track stays inert (P1 behaviour, unchanged).
- Fine pointers: `‹ ›` cursor chip following the pointer on the track.
- Background ink figures stay as a two-depth parallax layer above the photo and below the text, reduced in weight so they read against a photograph.
- Reduced motion: no blur, no parallax, no ruler easing; the track still snaps and works. No-JS: the track is a scroll container with real `<a>` links per panel and the ruler is static at the first stop.

## Photos used in panels

Real photographs the owner supplied in `~/Pictures/filmi.nambi`, copied to `public/photos/` with stable names `<yyyy-mm-dd>-<n>.jpg` (the 4 most distinct ones, deterministic order by filename). Alt text is a neutral factual description; no claims about the owner. The assignment to panels is a placeholder the owner will revise. Do not crop faces; use `object-fit: cover` with a per-panel `object-position`.

## Captures required (light and dark each)

375x812, 768x1024, 1280x800, each at panel 0 and panel 2 (`?panel=0`, `?panel=2`), plus one mid-drag state at 375 (readout between stops) and one with the overlay open from a tap (`/` then tap the focused panel). Capture under `prefers-reduced-motion` for deterministic figures, and from the production build.

## Baselines

`.agents/screens/baselines/slider-focus/<WxH>-<theme>-<state>.png`.
