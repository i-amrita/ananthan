# Screen: landing panels v3 (no photos, focus blur)

> Owner steer: `.agents/plans/2026-11-02-ananthan-v3-steer.md` items 2, 4 and 8.
> Supersedes the photo panels of `slider-focus.md` and `home-hero.md` for the landing route only.
> Reference: `.agents/screens/references/rare-squash.png` (the blur-as-depth-cue reference).

## Goal

The landing is a four-panel focus slider on paper. No background photographs, no scrim, no
viewfinder brackets. Each panel is a single-section hero: a header, a tagline, and (except on
Intro) one CTA. The blur moves across the *content* of the panels, not across a photo.

## Panel order (everywhere)

| # | Panel | Route | CTA |
|---|---|---|---|
| 0 | Intro | none | none (no CTA at all) |
| 1 | Research | `/research` | opens the Research drawer |
| 2 | Photography | `/photography` | opens the Photography drawer |
| 3 | Life | `/life` | opens the Life drawer |

The order is fixed in `src/lib/panels.ts` (`PANELS`) and drives the ruler stops, the `?panel=`
index, the drawer routes and the i18n labels. Focus stops stay `0.30 / 0.50 / 0.70 / 1.00`.

## Layout (375x812 first)

```
375x812
┌─────────────────────────┐
│  [nav chip, fixed top]  │  sharp, outside the blurred layer
│                         │
│  01 / 04                │  mono index, muted
│  Research               │  display header
│  protein language       │  short list of research topics
│  models, gene           │
│  regulation, ...        │
│  [ Research drawer → ]  │  CTA, opens the drawer
│                         │
│ 02 RESEARCH 03 PHOTO    │  ruler labels (neighbours)
│  ●            ○         │
│ ─┬──┬──┬▼─┬──┬──┬──┬── │  ruler: ticks, red needle + triangle
│       0.5   0.7         │  numeric stops
│ FOCUS 0.50 M            │  live readout
└─────────────────────────┘
```

## Intro panel

Header `Ananthan Nambiar` (the page `h1`, so exactly one `h1` on the route), the tagline, and the
social links as icon-only buttons. No CTA. Social links are the URLs already in the repo
(`src/lib/site.ts`: Scholar, ORCID, GitHub, Instagram, portfolio) plus the owner's Instagram
`https://www.instagram.com/filmi.nambi`. No invented handles, no email link.

## Blur model

The blur is the focus cue, as in the reference. It is applied to the **content layer** of the
panels, not to the page and not to the photographs:

- The content of every panel lives in one layer per panel (`.focus-content`).
- The slider script writes `--focus-blur` (px) and `--focus-dim` (0..1) on the track, from the
  fractional position between two stops: `0` at a stop, `6px` in the middle between two stops.
- The layer that is currently between stops is blurred and dimmed; the panel exactly on a stop is
  sharp. The effect is continuous: the outgoing panel blurs as the incoming one sharpens.
- The nav chip, the focus ruler and the shutter button are NOT in the blurred layer. They stay
  sharp at all times.
- No blur without JavaScript (the value is only written by the script) and no blur under
  `prefers-reduced-motion: reduce`.

Implementation: the blur value is written to a CSS custom property on the track, and each panel
computes its own blur from its distance to the focused stop. That way the blur follows the finger
continuously instead of snapping between panels.

## Drawers

| Drawer | Content |
|---|---|
| Research | publications and talks from the collections, titles trimmed to 80 chars with an ellipsis, the full title in the `title` attribute. A "See More" link to `/research`. |
| Photography | a masonry of the photos in `public/photos` and the photos collection, a CTA to `https://www.instagram.com/filmi.nambi` and a link to `/photography`. |
| Life | the same content as `/life`: hobbies, bio and career. |

The existing drawer infra (P1) is reused: `ActionOverlay` (vaul sheet below 640px, docked Radix
panel from 640px), `?overlay=research|photography|life` as URL state.

## Captures required (light and dark each)

375x812, 768x1024, 1280x800: panel 0 (Intro), panel 1 (Research), panel 2 (Photography),
panel 3 (Life), one mid-drag state between two stops (readout between stops, blur visible), and
one with the Research drawer open. All from the production build.

## Baselines

`.agents/screens/baselines/landing-v3-panels/<WxH>-<theme>-<state>.png`.
