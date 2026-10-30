# Rubric: Ananthan site v2

Evaluator-only. Never shown to the generator as a checklist (UILOOP anti-pattern). Read only after all hard gates pass. Judge the screenshots against the screen spec, not taste.

## Criteria (each finding cites a spec line and a screenshot path)

1. Slider is the navigation: no vertical scroll on `/` at 375x812, 768x1024, 1280x800. Any second prominent nav surface is P1.
2. Panel visual: full-bleed, hard edge, no card, border, shadow or gap; display title legible over the image; numeric index and progress bar present and tracking the focused panel.
3. Chip: collapsed state shows exactly the icons the spec lists; expansion is inline, not a flyout.
4. Drawer: bottom sheet below 640px, docked panel from 640px; scrim visible; background track inert; close affordance reachable by thumb.
5. Photography: real photos only, no layout shift, no cropped faces or horizons cut by the grid, IG CTA visible without scrolling the panel.
6. Type and color: paper/ink tokens only, per-route accent only on its own route, contrast legible in light and dark.
7. Fidelity of copy: no invented facts about the owner; placeholder content is visibly marked.
8. Motion: nothing animates under `prefers-reduced-motion`; no motion that obscures content.

## Severity

- P0: broken interaction, content unreachable, hard-gate-adjacent defect.
- P1: spec violation visible at a glance.
- P2: polish.
