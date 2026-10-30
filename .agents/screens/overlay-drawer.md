# Screen: panel drawer (P1)

> Spec: `.agents/plans/2026-10-30-ananthan-site-revision.md` sections "Navigation model" and "Panels vs pages". References: `.agents/screens/references.md` (rare-squash, Bureau Cool, Project Aperture, Kinoria) with local captures in `.agents/screens/references/`.

## Behaviour

- `/?overlay=research` opens a stub panel. Below 640px a bottom drawer (vaul), from 640px a docked right panel (Radix dialog).
- Close: Escape, Back, scrim click, close button. Back restores the exact `panel` position.
- While open: track `inert` and `overflow: hidden`, `html[data-overlay-open]` set.
- `panel` is owned by the slider script, `overlay`/`scroll`/`nav` by nuqs.

## Captures required (light and dark each)

375x812, 768x1024, 1280x800: closed, open.

## Baselines

`.agents/screens/baselines/overlay-drawer/<WxH>-<theme>-<state>.png`. This fixes the baseline location for v2.
