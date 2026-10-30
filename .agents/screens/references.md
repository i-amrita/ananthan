# References: focus slider + drawer/panel

Patterns for the v2 hero slider and the panel/drawer shell. Each entry: what
the product does, which checkpoints it governs, and the local screenshot that
backs it. Follows the UILOOP references contract: every rule below is grounded
in more than one product, not a single-site anecdote.

## Applies to

- `overlay-drawer.md` (P1 screen spec) — the drawer/panel rules.
- The future P2 slider spec — the slider rules.

## 1. rare-squash (the owner's visual target)

URL: https://rare-squash-390416.framer.app/ (live as of 2026-10-30; the site
is a photographer's portfolio, "Ines Varrow - Pictures at every distance").
Local captures: `.agents/screens/references/rare-squash.png` (1280x800),
`rare-squash-hero-crop.png` (owner-supplied crop).

Verified live, not from memory:

- **Focus scale as the hero interaction.** A distance scale (0.3m to
  infinity, with M/FT markings) is the primary control; scroll or drag pulls
  focus across frames. The focused frame is sharp; the others carry real lens
  blur (the site states it computes actual circle of confusion per lens and
  aperture). This is the site's own metaphor, and it is the metaphor we are
  borrowing: the slider IS the navigation, blur IS the depth cue.
- **Panel anatomy** (per frame): numeric index (`01 / 14` or `01 / 08`),
  category + title + one-line caption, EXIF-style metadata line
  (`100 mm · f/4 · 1/125 s · ISO 200`), and a "Focus 0.3 m" readout that
  updates live. The focused state announces itself with text ("01 · in focus
  at 0.30 m"), not only with blur.
- **A drag-to-browse rail** in section 03 with "Drag to browse · 8 projects"
  and an "All work →" link per item. The rail items are full-bleed image
  cards with a text block; no rounded-card chrome, no borders.
- **Breakpoint snapping**: the focus scale reads discrete values (0.3, 0.4,
  0.5...) and the site settles on one; there is no mid-way resting state.
- A peaking/zoom readout (`×2.6 · Peaking`) near the focus control — the
  "camera HUD" garnish. We take the readout idea, not the fake EXIF data.

What we take: full-bleed panels, numeric index, live readout, drag rail with
"All work →" (= our See More), discrete snap, blur as the depth cue.

## 2. Bureau Cool

URL: https://bureau.cool/. Local capture:
`.agents/screens/references/bureau.png`.

- **Text-first list, panel preview on hover, canvas overlay only in
  transition.** The DOM content is always the real content; the effect layer
  is `pointer-events: none` and sleeps when idle. Governs our rule: the
  slider works with zero JS; panels add on top; nothing decorative ever
  blocks input.
- **Restraint as identity.** No card chrome, no shadows on list items, one
  accent. Governs the panel visuals: full-bleed, no rounded-card borders.

## 3. Project Aperture

URL: https://www.project-aperture.com/. Local capture:
`.agents/screens/references/aperture.png`.

- **Viewfinder brackets + minimal chrome** (verified shipped CSS:
  `.bracket-tl/tr/bl/br`, plain `border` divs sized with `clamp()`). Governs
  the focused-panel brackets.
- **Accessibility posture**: skip link, sr-only h1, aria-live status region,
  keyboard operation documented in an aria label. Governs our panel a11y
  contract (aria-live announcer, keyboard-only operability).
- **Progressive enhancement**: real HTML nav under the canvas. Governs
  no-JS: the static markup must be the real links; JS adds the slider and
  panels on top.

## 4. Kinoria (negative reference)

URL: https://kinoria.studio/. Local capture: `.agents/screens/references/kinoria.png`
(nearly blank at 1280x800 — the site is a heavy WebGL build with a designed
"dead note" fallback; a headless capture without full GPU lands in the
fallback). 

What it governs: the **failure state must be designed**. Kinoria ships an
explicit WebGL-failure screen with a reload action instead of a blank page.
Our analogue: no-JS and reduced-motion states get real content (panel links,
static figures), never a spinner or an empty track. Also a warning against
the WebGL path itself: 13MB bakes and rAF pacers for a personal site is the
trade we already rejected in v2.

## Cross-product convergences (the rules we adopt)

| Rule | rare-squash | Bureau | Aperture | Kinoria |
|---|---|---|---|---|
| DOM content is the real content; effects enhance | yes | yes | yes | yes |
| Discrete snap states, no mid-way rest | yes | — | — | — |
| Blur/defocus as the depth cue | yes | — | — | — |
| Full-bleed panels, no card chrome | yes | yes | — | yes |
| Numeric index / readout as a design element | yes | — | — | — |
| Corner brackets as the camera cue | — | — | yes | — |
| Designed failure/no-JS state | — | yes | yes | yes |
| Keyboard + aria-live announced state | — | — | yes | — |

Rules with support from two or more products are adopted into the specs.
Single-source ideas (rare-squash's EXIF garnish, Kinoria's rAF pacer) are
noted but not adopted.
