# Flow: navbar chip

## Goal
The navbar is a fixed 3-icon chip (locale, theme, expand `‹ ›`). Expanding reveals the route links inline; the state is `?nav=open`.

## Checks
- Collapsed by default: links hidden, `aria-expanded=false`.
- Expand and collapse toggle the links and `?nav=open`.
- `Escape` collapses and focuses the expand button.
- `/research?nav=open` loads expanded and marks the active route with `aria-current`.
- Tab order is locale, theme, expand, then the links; collapsed links are not focusable.
- Opening an overlay collapses the chip.
- Every control is at least 44px, the chip is `position: fixed`, and 375px does not overflow.
- With JavaScript disabled the links render expanded.
