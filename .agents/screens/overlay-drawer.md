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

## Approved state (iteration 3, 2026-10-30)

Verdict PASS from the isolated evaluator, hard gates green (console 0, 5xx 0, axe critical and serious 0, e2e green). Baselines are in `.agents/screens/baselines/overlay-drawer/`, captured from the production build with `prefers-reduced-motion` so the figures are frozen.

Open P2 items, carried forward (not blocking):

- Close button sits top-right on the docked panel at 768, the hardest one-handed zone on a tall tablet.
- The close button shows its focus ring on open and sits close to the title; move initial focus to the dialog container and add top padding.
- axe moderate: `landmark-no-duplicate-banner`, `landmark-unique` in the open state; fix in P8.
