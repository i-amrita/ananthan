# Screen: navbar chip

> v2 design. Replaces the sticky pill. A fixed, top-center chip with three icons that expands inline to reveal the route links. Shared by `/` and the content pages.
> `Navbar.astro` renders the fixed header and mounts one React island, `NavbarActions.tsx` (`client:load`). `data-nav-ready` and the `?nav=open` seed are set by a tiny inline script in `Base.astro`.

## Layout

```
 collapsed (375px)                 expanded (375px, links fit in one row)

      top: env(safe-area-inset-top) + 12px
        ┌──────────────┐            ┌──────────────────────────────────────┐
        │ [A] [◐] [‹ ›]│ 44px       │ ⌂ Research Life Photography [A] [◐] [› ‹]│
        └──────────────┘            └──────────────────────────────────────┘
```

| Item | Behavior | URL state |
|---|---|---|
| Links (Home, Research, Life, Photography) | real `<a>`, slide in to the left of the locale icon; the active route has `aria-current="page"` | none |
| Locale icon | opens the locale popover (`LocaleSwitchButton`), unchanged behavior | `?locale=` |
| Theme icon | toggles with the circular reveal, unchanged behavior | `?theme=` |
| Expand `‹ ›` | toggles the links; `aria-expanded`, label `nav_expand` / `nav_collapse` | `?nav=open` (push) |

## Behavior

- Fixed (not sticky), horizontally centered, `padding-top: env(safe-area-inset-top)`. Never hides on scroll.
- Expansion is inline: the chip grows leftwards by transitioning `max-width` and `opacity` of the links group. No flyout, no popover.
- Tab order: locale, theme, expand, then links when open. DOM order is locale, theme, expand; the links group sits visually left through `order`. Collapsed links are `visibility: hidden`, so they are not focusable.
- `Escape` collapses and returns focus to the expand button (replace, no history entry).
- Opening any overlay (`?overlay=`) collapses the chip first (replace).
- Pressing the expand button pushes `?nav=open`; Back collapses.
- No JS: `html:not([data-nav-ready])` shows the links statically. The inline script sets `data-nav-ready` (and `data-nav-open` when the URL has `nav=open`) before first paint, so hydration changes no layout. React mirrors state to `html[data-nav-open]`; all visual state is CSS on those attributes.
- Reduced motion: no slide; the group just shows and hides.

## Dimensions and tokens

| Property | Value |
|---|---|
| position | `fixed inset-x-0 top-0 z-40 flex justify-center`, `pt: calc(env(safe-area-inset-top) + 0.75rem)` |
| chip | `rounded-full`, `h-11`, `bg-surface/95 backdrop-blur`, `ring-1 ring-fg/15`, tinted lift shadow. Contrast holds over the full-bleed hero photo in light and dark |
| items | 44px square hit area (`size-11`); route links `h-11 px-2.5 text-xs` |
| width | collapsed about 140px; expanded fits 343px at 375 for `en`; longer locales wrap links to a first row (`flex-wrap`), never overflow |
| icons | Phosphor light, `size-5` |

## Acceptance (testable)

- Collapsed by default with JS; links not visible and not focusable.
- Click expand: links visible, `aria-expanded=true`, URL has `nav=open`.
- `Escape` collapses and focuses the expand button.
- `/?nav=open` loads expanded with no layout jump.
- JS disabled: the four links are visible.
- Every control is at least 44 x 44px; no horizontal overflow at 375.
