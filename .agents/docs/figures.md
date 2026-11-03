# Figures (background field)

`src/components/astro/FigureField.astro` renders the Memphis background of a route. Props are unchanged: `route` and `depth` (0 near, 1 and 2 progressively softer).

## Content

One YAML file per figure in `src/content/figures/`, schema in `src/content.config.ts`:

- `motif`, `label`, `route` (`home|research|life|photography|all`; `all` shows on every route), `weight` (0..1, scales peak opacity), `size` (viewBox), `order`, `draft`.
- `paths`: stroked SVG paths (round caps). `fills`: solid SVG paths (use arcs for dots). At least one is required.
- `motion`: `drift|spin|pulse|draw`. `draw` needs `paths`.
- `tone`: `ink|soft|coral|teal|mustard`. The pops are tokens (`--c-pop-*` in `tokens.css`), used for the field only.
- There is no authored position. Layout is computed.

Adding a figure is a content drop: add a YAML file, no code change.

## Layout

`src/lib/figure-layout.ts` places every figure with a seeded PRNG against two reference viewports (375x812 and 1280x800, the latter reused from 768px up, positions in percent and widths in px or vw-equivalent). Safe rectangles hold the navbar, the centred copy and the bottom hint and dock. Best-candidate sampling spreads the scatter. Figures may bleed a quarter of their width off the left or right edge. If the copy layout of a screen changes, edit the `safe` rects in that file.

## Runtime

An `is:inline` script after the field adds `data-live` (which hides every figure) and runs the scheduler. Cap: 6 alive on phones, 10 from 768px. Each spawn uses the Web Animations API on the figure wrapper (opacity plus a motion-specific transform) for 3.5s to 5s; `draw` also animates `stroke-dashoffset` on paths normalised with `pathLength="1"`. It pauses on `visibilitychange` and stops on `prefers-reduced-motion`. Reduced motion and no-JS never get `data-live`, so the static scattering shows at about half the peak opacity.

Spec: `.agents/screens/figure-field.md`.
