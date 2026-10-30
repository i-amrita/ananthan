## Purpose

Replace annambiar.github.io with a designed personal site for Ananthan Nambiar
(UW postdoc, ML for computational biology; film photographer, dancer, rower,
cook, environmentalist). The site leads with his hobbies as visual identity and
lists his work and research as content. Same constraints as amrita-site: Astro
SSG, static output to Cloudflare Pages, mobile-first.

## Decisions made

- Multi-page site, 4 routes. Home hero is a focus slider that doubles as
  navigation.
- Background art: ink-brush line art on paper (ASCII/dither explored and
  dropped).
- Figures are content-driven: a `figures` collection, no code changes to add
  one. Optimized for minimal long-term maintenance (he edits content only).
- Approach A (zero WebGL, CSS/SVG motion only) for v1, with a timeboxed spike
  of approach B (twgl.js shader layer) to compare tradeoffs for real.
- Camera metaphor: depth-of-field focus, zoom cursor, viewfinder brackets,
  aperture-iris view transitions. No actual photo-capture mechanic (Kinoria's
  is months of work).
- Photography: 3-5 of his own photos on-site with lightbox, prominent CTA to
  nambiar4.myportfolio.com (his copyright lives there).
- i18n: same 5 locales as amrita (en/ms/hi/de/ml) via Paraglide + intl-ai.
- Codebase: clone the amrita-site scaffold currently sitting in chetta-site,
  strip what he doesn't need.

## Routes

- `/` — hero focus slider. Panels: Intro, Research, Life, Photography. The
  slider is the home navigation; each panel links into its route.
- `/research` — publications (~16), talks, courses. File-based collections.
- `/life` — hobbies (photography, dance, rowing, cooking, environmentalism)
  plus short bio (amrita's about folds in here).
- `/photography` — a few photos with lightbox + CTA to his portfolio.

Shared chrome: top nav, locale switcher, theme toggle (carried from amrita).

## Hero focus slider

- Native CSS `scroll-snap` track, 4 full-viewport panels. Mobile gets the
  gesture for free; ~2KB vanilla JS adds desktop drag momentum + snap-assist
  and arrow keys.
- Camera cues, all cheap:
  - Depth of field: focused panel sharp at scale 1.0; neighbors dimmed,
    blurred, slightly scaled down (`filter: blur()`, GPU-composited).
  - `cursor: zoom-in` on panels, fine-pointer devices only.
  - Viewfinder corner brackets (pure CSS `border` divs, `clamp()` sizing)
    marking the focused panel — from Project Aperture, ~30 lines.
  - Route changes use Astro View Transitions with an aperture iris
    (8-blade `clip-path: polygon()`), ~20 lines of CSS.
- Ink figures sit behind the slider as a two-depth parallax layer (CSS
  transform on scroll, no JS).
- Accessibility: real scroll container, `role="group"`, real `<a>` links in
  panels (degrades to a normal page without JS), arrow-key support,
  `prefers-reduced-motion` disables parallax/blur/iris.

## Ink-brush figure system

Content collection, one file per figure:

```yaml
# src/content/figures/dna.yaml
motif: dna
label: "DNA double helix"
route: research
weight: 0.8
paths: ["M30,10 C55,10 ..."]
size: [140, 140]
position: { x: 12, y: 30 }
delay: 0
```

- `FigureField.astro` queries the collection for the current route and inlines
  static SVGs. No build-time image processing, no JS.
- Animation: stroke draw-in via `stroke-dashoffset` (dasharray computed from
  path length at build and inlined), hold ~85% opacity, fade out. ~14s per
  figure cycle, staggered delays. Subtle `feTurbulence` displacement for ink
  wobble. CSS-only.
- Grain: static SVG `feTurbulence` data-URI tile, opacity ~0.05.
- Palette: warm paper `#f5f1e8`, ink `#2b2b2b`, per-route accent (research
  indigo, life terracotta, photography sepia). Dark mode: deep charcoal paper,
  bone-white ink.
- Reduced motion / no-JS: figures frozen mid-draw (~60%), no cycling.
- Adding a figure = drop a YAML file with an SVG path. Figures can be tied to
  individual publications so /research's background derives from actual work.

## Content model (maintenance story)

- Collections: `publications`, `talks`, `courses`, `figures`, `photos`.
- His only job: drop a .md/.yaml file and commit. No component or config edits.
- Publications get stable anchors (`/research#dr-bert-2024`).
- `.md.ts` companion endpoint per route + build-time llms.txt / llms-full.txt
  (amrita pattern; never hand-edited).
- Photos: image in `public/photos/`, caption, required alt text in the schema,
  aspect. Lightbox is a `<dialog>` + CSS transitions, no library.

## Stack

Clone amrita-site scaffold (it already runs Astro 7.4 + Tailwind 4; AGENTS.md's
"Astro 6" note is stale — fix it). Keep: Astro 7, Tailwind 4, Paraglide +
intl-ai, oxlint/oxfmt, lefthook, wrangler/Cloudflare Pages, Pagefind, satori OG
images, sitemap. Drop: keyboard hero + audio sprite machinery, CmdK keyboard
nav, overlay system, work/posts collections, amrita-specific i18n demo.

## Approach B spike (timeboxed)

Implement grain + light-leak + route-transition wipe as a twgl.js (~7KB gz)
WebGL2 layer: DPR capped at 1.5, 30fps cap, paused off-screen and under
reduced-motion, static fallback when WebGL fails. Compare side-by-side with A
on a mid-range phone viewport: bundle delta, paint time, frame rate, heat.
Decide: keep A, adopt B, or adopt B for one effect only (likely the transition
wipe). Spike on a throwaway branch; decision recorded here.

## Testing

Playwright e2e (amrita pattern): axe-core a11y gates, keyboard nav,
reduced-motion pass, 375px mobile viewport. Covers 4 routes + lightbox +
search.

## Research facts baked in

- Email nambiar4@uw.edu; Scholar, ORCID 0000-0002-9767-9456, GitHub annambiar,
  IG @filmi.nambi, portfolio nambiar4.myportfolio.com.
- ~16 publications incl. DR-BERT (Structure 2024), FUN-PROSE (PLoS Comp Bio
  2023), ACM-BCB 2020; CSH Perspectives editor 2025.
- "Language of life" is his recurring brand metaphor (thesis → talks → papers);
  usable as a typographic/sequence motif.
- Career arc: Malaysia → Reed → UIUC → Mayo → UW.
