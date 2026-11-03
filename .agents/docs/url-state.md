# URL state contract

Every visible UI state must be reachable as a static URL. Source of truth: `src/lib/url-state.ts`
(parsers and history rules). If this doc and the code disagree, the code wins and this doc gets
fixed in the same commit.

Islands bind the parsers with `nuqs` through `useQueryStates(urlStateParsers)`. `Providers.tsx`
wraps every island root in `NuqsAdapter`, so all islands share one URL emitter. Astro routes read
the same keys from `Astro.url.searchParams`. The inline script in `Base.astro` reads state before
paint: `?theme=` goes on `<html data-theme>`, and a saved `?locale=` is restored with
`history.replaceState` before hydration.

## Parameter table

| Param | Parser | Allowed values | History | Written by | Notes |
|---|---|---|---|---|---|
| `overlay` | `parseAsStringLiteral(OVERLAYS)` | `research`, `life`, `photography` | push | FocusOverlays island (stub panels now, slider activation wiring in P2). | One overlay at a time. Opening another overlay replaces the value. `panel` keeps its value while `overlay` is set, so Back closes the panel and restores the slider position. While `overlay` is set, `<html>` carries `data-overlay-open` and the hero track is `inert` with `overflow: hidden`. |
| `scroll` | `parseAsInteger` | integer | replace | The overlay shell: pixel `scrollTop` of the panel body, throttled 200ms, restored on open. Not wired yet (P7). | Close clears it. |
| `nav` | `parseAsStringLiteral(['open'])` | `open` | push | The 3-icon nav chip (P4). | Only value is `open`. Back collapses it. |
| `panel` | `parseAsInteger` | integer 0..3 | replace | The focus slider inline script only. | The overlay island never writes it, so the slider position survives opening and closing a panel. Absent means the first panel. Out-of-range values clamp at the ends. |
| `theme` | `parseAsStringLiteral(THEMES)` | `light`, `dark` | replace | The theme toggle. | Applied before paint by the inline script in `Base.astro`, which sets `<html data-theme>`. Absent means OS preference. |
| `locale` | `parseAsStringLiteral(LOCALES)` | `en`, `ms`, `hi`, `es`, `ml` | replace | The locale switcher. | The choice is also saved to `localStorage.locale`. On a visit without `?locale=`, the head script in `Base.astro` restores it with `history.replaceState` before hydration; an explicit `?locale=` always wins. `en` clears the param. |
| `q` | `parseAsString` | any string | replace | The search input. | Search query. |
| `mode` | `parseAsStringLiteral(['ai', 'keyword'])` | `ai`, `keyword` | replace | The AI / Keyword toggle on the search panel. | Absent means AI (hybrid when the model is warm). `keyword` never loads the model. |

Values outside the allow-list are not valid state. Expected behavior is that the param reads as
absent (the overlay stays closed, the theme falls back to the OS setting).

## History rules

`historyFor` in `url-state.ts` is the single map; each parser picks up its history mode through
`.withOptions({ history: historyFor[key] })`, so the two cannot drift.

- `push`: `overlay`, `nav`. Back closes the overlay or collapses the chip.
- `replace`: everything else. `panel`, `scroll`, `theme`, `locale`, `q`, `mode`.

Rule: high-frequency or cosmetic state uses `replace`. Anything a user would expect Back to undo
uses `push`.

## Close patch

Closing an overlay sets `overlay` and `scroll` to `null` with `history: 'replace'`, so Back after a
close does not reopen the panel. It leaves `theme`, `locale`, `q`, `mode`, `nav`, and `panel`
alone, so preferences and the slider position survive.

## Helper

`href(path, state)` builds a shareable URL. Null, undefined, and empty values are dropped. Numbers
are stringified.

```ts
href('/', { overlay: 'research' }); // "/?overlay=research"
href('/', { panel: 2, overlay: 'research' }); // "/?panel=2&overlay=research"
href('/', {}); // "/"
```

## Example URLs

- `/?overlay=research`: the research panel is open as a stub drawer.
- `/?panel=1&overlay=research`: slider on panel 1, research panel open. Back closes the panel and
  returns to the exact slider position.
- `/?panel=2&overlay=research&scroll=400`: P7 target, panel scroll restored on open.
- `/?theme=dark`: dark theme forced, regardless of OS setting.
- `/?locale=ms`: Malay.
- `/?nav=open`: nav chip expanded (once P4 ships).

## QA flows (for the playwright-cli skill)

These are the reproducible checks. Each step is an action and an assertion.

1. Pre-paint theme. Open `/?theme=dark`. Assert `<html data-theme="dark">` and `color-scheme`
   computes to `dark`. Repeat with `/?theme=blue`. Assert no `data-theme` attribute is set.
2. Reject unknown values. Open `/?overlay=nope`. Assert no overlay is open.
3. Deep link. Open `/?overlay=research` at 375x812. Assert the bottom sheet is visible and
   `<html data-overlay-open>` is set; the track is `inert`. At 1280x800 the same URL renders a
   docked right panel instead.
4. Escape closes. Press Escape. Assert `overlay` is absent from the URL and `data-overlay-open` is
   gone.
5. Back closes. Open `/`, push `?overlay=research` from in-page code, then press browser Back.
   Assert the URL has no `overlay` param and the panel is closed.
6. `panel` survives. Open `/?panel=2&overlay=research`, close the panel, assert `panel=2` is still
   in the URL.
