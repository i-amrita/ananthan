# Ananthan Nambiar site — revision (v2)

Date: 2026-10-30. Supersedes the v1 spec (`docs/design/ananthan-site.md`) for
navigation and interaction. Content model, collections, i18n and the ink figure
system carry over unchanged.

## Why v2

v1 built the design faithfully but the result is off. Root cause: v1 treated the
focus slider as a *hero banner that links out to pages*. The brief was actually
that the slider **is** the navigation. Three concrete divergences drove the miss:

1. Navigation went to separate pages via a full-text navbar. The brief wants the
   navbar collapsed into a 3-icon chip, so the slider stays the only prominent nav.
2. Panels were prose pages reached by a page link + aperture-iris view transition.
   The brief wants amrita-site's drawer/panel pattern: open a panel in place,
   with a "See More" link inside the panel to the dedicated page.
3. The visual target is rare-squash's slider, not the v1 blur-and-brackets
   treatment. That reference has full-bleed image panels with a hard edge,
   a numeric index, a progress bar, and a large display title — not blurred text
   panels on flat paper.

## v2 requirements (from the owner, 2026-10-30)

- The focus slider is the main interaction across the whole site.
- Navbar collapses into a 3-icon chip: locale, theme, expand/collapse toggle
  showing `< >`. Expanded, it reveals the nav links. Otherwise links are not shown.
- Mobile-first, single hero-section SPA. No vertical scrolling on the landing page.
- Separate pages are reached via drawer/panels (amrita-site pattern), not via
  page transitions. A panel carries a "See More" link to the dedicated page.
- Footer: llms.txt link and QR code only, as in amrita-site.
- Photography: use the real images from `~/Pictures/filmi.nambi`, with a
  "See more" link to `https://www.instagram.com/filmi.nambi`.
- On mobile, photography layout is a virtualized masonry/bento grid, vertical.
- UILOOP (`~/UILOOP.md`) applies to every pixel-rendering change.

## Navigation model

### Slider activation

| Input | Result |
|---|---|
| Tap/click the focused panel (<6px move, <250ms) | opens that panel's drawer/overlay |
| Tap/click a non-focused panel | focuses it, does not open |
| `Enter`/`Space` on the track | opens the focused panel |
| Flick/drag release | advances panels (momentum + snap) |
| Dots | focus only |

State machine: `idle → dragging → settling → idle`, with
`opening → panel-open → closing` orthogonal to it.

`?panel=N` (replace) tracks the focused panel; `?overlay=research|life|photography`
(push) tracks the open panel. Opening a panel does not clear `panel`, so Back
closes the panel and restores the exact slider position. The Intro panel has no
own page: activating it advances to panel 1 and its CTA becomes "enter".

While a panel is open the track is `inert` and `overflow: hidden`, so momentum
gestures cannot shift it behind the drawer.

### Panels vs pages

| Layer | Content |
|---|---|
| Slider panel | label + one-sentence body (existing `hero_*_body` keys) |
| Panel (drawer) | teaser only: up to 5 curated items projected from the collections at build time |
| Page | the exhaustive list (all publications, full gallery) |

`src/lib/panels.ts` exposes `getPanelTeaser(route)`. Pages never import it and
it never renders page MDX, so teaser and page cannot drift in content source —
only the projection differs (top-N vs full list).

"See More" is a real navigation to the dedicated page: research → `/research`,
life → `/life`, photography → `/photography`. The aperture-iris view transition
is retained for that jump only.

Panel scroll position is mirrored to `?scroll=` (replace, throttled 200ms) and
restored on open, as in amrita. Deep link: `/?panel=1&overlay=research&scroll=400`.

### The 3-icon chip

```
[ EN ]  [ ☀/☾ ]  [ ‹ › ]
 locale  theme   expand
```

Fixed position (not sticky) so it never competes with the 100dvh track, with
`padding-top: env(safe-area-inset-top)`.

The `< >` toggle expands **inline**: the pill grows and the route links slide
in to the left of the locale icon. Inline expansion, not a flyout or drawer,
because the slider is supposed to remain the only prominent navigation — a
flyout would be a second competing surface. `?nav=open` (push) holds the state.

Tab order: locale → theme → expand → Research → Life → Photography (when open).
`Escape` collapses and returns focus to the expand button. Opening a panel
collapses the chip first.

No-JS: the links are rendered collapsed but `html:not([data-nav-ready])` reveals
them statically, where `data-nav-ready` is set by an inline pre-paint script.
No-JS users get the full nav pill; JS users get the 3-icon chip.

## Slider visual target (rare-squash reference)

The v1 treatment (blurred text panels on flat paper) is replaced. The target:

- Full-bleed panels, each a photograph or ink-figure composition, edge to edge.
  No rounded card, no border, no shadow, no gap between panels.
- A large display title, hard-edged, sitting on the image with a legible
  treatment (scrim or ink-paper type block), not blurred.
- A numeric index (`01 / 04`) as a real design element.
- A progress bar that tracks the focused panel.
- The `‹ ›` focus cursor on fine pointers, following the pointer with a zoom
  affordance.
- A snap-to-breakpoint slider that settles to the nearest panel when the user
  leaves it mid-drag.
- Background figures fade in/out behind the panels as two parallax depths.

The current `FocusSlider.astro` already implements the mechanics (scroll-snap
track, 100dvh, drag momentum, arrow keys, `?panel=` state, viewfinder brackets,
depth-of-field blur). v2 keeps the mechanics and replaces the panel contents
and chrome.

## Photography

Source: `~/Pictures/filmi.nambi` (10 JPEGs, 1000x1000 to 1080x1351, all
square or 4:5 portrait). They are copied into `public/photos/` with stable
filenames derived from the Instagram post id and date.

Content collection `src/content/photos/` entries: `id`, `src`, `alt` (required
by schema), `caption`, `aspect` (derived from the real dimensions), `date`,
`order`.

Layout, mobile-first:
- **Panel (drawer)**: a virtualized masonry grid, vertical, 2 columns on phone,
  3 on wider. Virtualized because the set will grow; with ~10 images a plain
  CSS columns layout is enough, but the panel must not assume a fixed count.
  Implementation: a small windowed grid component that renders only the rows
  near the viewport. No library; ~60 lines.
- **Page** (`/photography`): the full grid, same component, plus a lightbox.

"See more" CTA: `https://www.instagram.com/filmi.nambi`, external link with
`rel="noopener"`, opens in a new tab.

## Footer

Exactly two items, matching amrita-site: a link to `/qr` and a link to
`/llms.txt`. `/qr` is a static page rendering an SVG QR of the absolute home URL
via the `uqr` package (already a dependency), with a `.md.ts` companion per repo
convention. No email link, no license link, no social row.

## Component inventory

New:
```
src/components/react/ActionOverlay.tsx        # amrita shell: vaul drawer <640px, Radix docked panel >=640px
src/components/react/FocusOverlays.tsx        # island root: nuqs useQueryStates, renders 3 panels, owns close
src/components/react/ResearchPanel.tsx
src/components/react/LifePanel.tsx
src/components/react/PhotographyPanel.tsx     # virtualized masonry grid
src/components/react/PhotoGrid.tsx            # shared virtualized grid (panel + page)
src/components/react/NavChip.tsx              # 3-icon chip + inline expansion
src/components/ui/drawer.tsx                  # vaul wrapper (port from amrita)
src/lib/panels.ts                             # build-time teaser projection
src/pages/qr.astro, src/pages/qr.md.ts
```

Modified:
```
package.json                                  # + vaul
src/lib/url-state.ts                          # + overlay, scroll, nav (history: push/replace)
src/components/astro/FocusSlider.astro        # new panel visuals, activation wiring, inert handling
src/components/astro/Navbar.astro             # shell around NavChip
src/components/astro/Footer.astro             # llms.txt + QR only
src/layouts/Base.astro                        # mount FocusOverlays island
src/pages/index.astro                         # pass teaser data
src/pages/photography.astro                   # full grid + lightbox + IG CTA
src/content/photos/*.json                     # real photos replace placeholders
src/i18n/messages/*.json                      # new keys (en, then intl-ai fill)
.agents/docs/url-state.md                     # contract update
```

## i18n keys to add

```
overlay_research_title|description|read_more
overlay_life_title|description|read_more
overlay_photography_title|description|read_more
overlay_close
nav_expand, nav_collapse, nav_menu
footer_qr, qr_aria, qr_hint
hero_enter
```

## Sequencing

One session per piece, each in its own worktree off the previous approved
state, each reviewed by the owner before the next starts. The owner is the
evaluator, so UILOOP's evaluator-isolation and rubric gaps do not block
anything; what must still be honored per piece: a screen spec written just
before the piece is built, a reachable URL, screenshot capture via
`playwright-cli`, and the hard gates (0 console errors, 0 network 5xx, 0 axe
critical/serious, no layout collapse at 375/768/1280).

| # | Piece | Depends on | Done looks like | Main risk |
|---|---|---|---|---|
| P1 | URL schema + drawer primitives + one stub panel | — | `/?overlay=research` opens a drawer on phone width, docked panel on desktop; Escape/Back/scrim close | nuqs adapter double-mount |
| P2 | Slider panel visuals (rare-squash target) + activation wiring | P1 | full-bleed panels, index, progress bar, tap-to-open, flick still advances | click-after-drag false positives |
| P3 | Panel teaser content + 3 panels | P2 | each panel shows <=5 real collection items | teaser/page drift |
| P4 | Nav chip + inline expansion | P1 | 3-icon pill, expands inline, Escape collapses, no-JS shows links | hydration mismatch |
| P5 | Photography: real photos, virtualized grid, lightbox, IG CTA | P2 | grid renders real images at 375/768/1280, lightbox opens | large images, layout shift |
| P6 | Footer + QR page | P1 | footer has exactly two links, `/qr` renders | link checker expectations |
| P7 | Scroll persistence + deep links | P3 | `/?overlay=research&scroll=400&panel=1` restores exactly | restore race vs drawer layout |
| P8 | A11y + reduced-motion + e2e gate | all | axe 0, keyboard-only tour works, e2e green | none new (verification gate) |

## Risks

- The panel and the slider both write URL state; keep `panel` owned by the
  slider script and `overlay/scroll/nav` owned by nuqs, and add an e2e that
  flicks twice then opens a panel and asserts both params survive.
- `vaul` is not currently a dependency; it must be added.
- iOS `100dvh` + drawer body-lock: guard with `html[data-overlay-open]`.
- Photo file sizes (~50-140KB each) are fine as-is; serve WebP copies and keep
  the originals out of the repo if needed.
- The v1 figure system (5 YAML motifs) stays, but its visual weight must drop:
  on full-bleed image panels the figures become an overlay layer, not the
  backdrop of empty paper.

## Photography note

The ten frames in `~/Pictures/filmi.nambi` are documentary/conceptual work:
suburban houses and rail lines under brooding skies, a figure seated in a glass
atrium, quiet architectural and street fragments, and a portrait. Palette is
muted and desaturated — earth tones, slate, cream — which sits well against the
warm paper and ink tokens already in `src/styles/tokens.css`. The ink figures
should be redrawn with heavier, wetter strokes so they read against a
photograph rather than a blank page.

## Calca assessment

`@calca/*` (npm org, ~3.5 weeks old, ~300 downloads/month, single maintainer)
is an open canvas where agents propose HTML variations that a human reviews on
an infinite canvas, with propose-then-apply as the default mutation mode.

Fit to this workflow:
- The propose/review/apply gate is genuinely close to "owner previews and
  approves each session".
- But Calca frames are standalone Tailwind HTML, not Astro components. What is
  approved on the canvas still has to be re-implemented into `src/pages/`, which
  means double authorship and drift risk on exactly the thing we are trying to
  avoid.
- The MCP contract has no screenshot export (issue #23 is open), so it cannot
  feed the UILOOP evaluator leg, which reviews screenshots of the real build.
- It does not touch the Astro build, the worktree isolation, or the e2e gates.

Verdict: **do not adopt now**. The UILOOP loop with the owner as evaluator
already covers the human-approval role, and the capture leg is real-site
Playwright, which Calca cannot replace. Revisit when `exportScreenshot` and
Phase 3 formats ship (post-1.0). A cheap spike is possible later if the canvas
review surface proves better than reading screenshots in chat.
