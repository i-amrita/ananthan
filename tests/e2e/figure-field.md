# Flow: figure field

## Goal
The home background is a Memphis field: many pre-placed figures, invisible until a scheduler fades a bounded number in and out. It must never sit under the focused panel copy.

## Checks
- Live: figures exist, at most 6 (phone) or 10 (wide) are animating at once, and over time some are.
- Live: figure animations use opacity and transform only (plus the dash offset for `draw`).
- Reduced motion: no `data-live`, nothing animates, and the figures show a static low opacity scattering.
- At 375x812, 768x1024 and 1280x800 no rendered figure overlaps the focused panel copy.
