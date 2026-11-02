# Screen: motion transitions (v3)

> Owner steer 2026-11-02, items 3, 7 and 9 of `.agents/plans/2026-11-02-ananthan-v3-steer.md`.
> Three motion surfaces: the overlay drawer, the theme toggle, and page-to-page navigation.

## 1. Overlay drawer and panel

Both variants share one shell (`src/components/react/ActionOverlay.tsx`):

```
375x812 (bottom sheet)          1280x800 (side dock)
┌───────────────────────┐        ┌──────────────────┐┌──────────────┐
│░░░░░░ scrim ░░░░░░░░░│        │░░ scrim ░░░░░░░░░░││  Research  [×]│
│░░░░░░░░░░░░░░░░░░░░░░│        │░░░░░░░░░░░░░░░░░░░░││              │
│░░░░░░░░░░░░░░░░░░░░░░│        │░░░░░░░░░░░░░░░░░░░░││  See more →  │
│╔═════════════════════╗│        │░░░░░░░░░░░░░░░░░░░░││              │
│║ ▬▬▬  (handle)       ║│        │░░░░░░░░░░░░░░░░░░░░││              │
│║ Research        [×] ║│        │░░░░░░░░░░░░░░░░░░░░││              │
│║ description          ║│        └──────────────────┘└──────────────┘
│║ See more →           ║│           dock slides in from the right
│╚═════════════════════╝│           sheet slides up from the bottom
```

- Open: the sheet rises from the bottom edge, the dock slides in from the right edge. Transform only.
- The scrim fades in under the panel, opacity only.
- Close: the panel plays its exit animation and is only unmounted after the animation ends. Radix
  `Presence` keeps the node mounted while `data-state="closed"` is set, so the exit keyframes run.
- Duration 280-420ms, `cubic-bezier(0.32, 0.72, 0, 1)` (the repo spring curve).
- `prefers-reduced-motion: reduce`: opacity only, 120ms, no translate.
- The panel never animates while it is dragged by the handle (vaul owns the transform then).

## 2. Theme toggle

Reference: `../amrita-site` (`src/components/react/ThemeToggle.tsx`).

- Clicking the toggle starts a View Transition (`document.startViewTransition`), feature detected;
  without the API the theme flips instantly.
- The new theme is revealed through a circular `clip-path` expanding from the centre of the
  toggle button, ~500ms. The old root crossfade is suppressed so only the aperture is seen.
- The icon morphs: sun and moon cross-fade and rotate 90deg into each other, ~400ms.
- `prefers-reduced-motion: reduce`: no View Transition, no icon morph. The theme still flips.
- `?theme=` stays the source of truth; the toggle writes it with `replaceState`.

## 3. Page transitions

One cross-document View Transition. No router, no JS.

- `@view-transition { navigation: auto; }` on the document, so every same-origin navigation
  crossfades.
- The old page fades out over ~180ms, the new page fades in over ~260ms and settles 8px upward.
- `main` carries `view-transition-name: page-main`, so the movement is limited to the content.
- The nav chip (`header`) and the shutter button carry their own `view-transition-name`, so they
  do not flash during the swap.
- `prefers-reduced-motion: reduce`: no `@view-transition`, so navigation is instant.
- The `?panel=` slider state is untouched: the hero track is client state, not a navigation.

## Captures required

375x812, 768x1024, 1280x800; light and dark; open, mid-animation and closed for the drawer;
3-4 frames at 80ms spacing for each of the three surfaces.
