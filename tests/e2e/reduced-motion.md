# Flow: reduced motion

## Goal
`prefers-reduced-motion` removes the garnish: no ink animation, no figure scheduler, no focus blur. The page stays fully usable.

## Checks
- The hero still renders and navigates (arrow keys move the focus).
- The panel content never blurs, even mid-drag.
- The figure field shows a static scattering, no running animations.
- Nothing inside `main` runs a CSS animation.
