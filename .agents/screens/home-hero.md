# Screen: home hero (desktop 1280 x 800)

> TARGET state. A single centered editorial column with the 12-key macropad. It stays one column at 768 and 1280 (no split layout). The column is `max-w-md` (448px).
> Mobile counterpart: `mobile-vertical.md`. Tablet: `tablet-768.md`. Pill: `navbar-pill.md`. Key map: `home-keyboard-actions.md`.

```
1280px
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                       ┌──────────────────────────────┐                       │ mt-3, h-9
│                       │ (home) About | Cmd-K | EN  o │                       │ sticky top-0
│                       └──────────────────────────────┘                       │
│                                                                              │
│                              I am  Amrita                                    │ 60px Fraunces
│                  I bridge the gap between technical                          │ 14px Jakarta
│                  complexity and real-world impact.                           │
│                                                                              │
│                                                                              │ mt-32 negative space
│                      ┌────────────────────────────┐                          │
│                      │ [esc][dial][Sound][ Find ] │                          │ chassis 342
│                      │ [Work][About][Res.][ Log ] │                          │
│                      │ [LinkIn][LET'S BUILD][EN] │                          │
│                      └────────────────────────────┘                          │
│                   Tap a key or press Cmd-K to open the command menu          │
│                                  llms.txt                                    │ footer, centered, muted
└──────────────────────────────────────────────────────────────────────────────┘
```

## Structure

- `index.astro`: `<main class="max-w-md mx-auto px-5 pt-6 pb-4 text-center">`. No `<hr>`. One column at every width, no grid, no side-by-side.
- The column is `max-w-md` (448px) and centered. The pad inside it is `max-w-[342px]`, centered.
- Hero `h1`: `I am <em>Amrita</em>`. Fraunces 400, 48px below `sm`, 60px from `sm` (640px). The name is italic, `text-brand`, with a thin `brand/40` underline at 8px offset.
- Subtitle: 14px Plus Jakarta Sans, muted-foreground, `mt-3`. There is no brand line and no affiliation line under it (`hero_title` and `hero_affiliation` were removed from all locales). `locales.spec.ts` asserts the ml subtitle instead.
- Link chips are gone from the hero. LinkedIn, Research and mail are keys in the keypad (see `home-keyboard-actions.md`).
- No options row above the pad. Highlight intensity is the dial key (`?highlight=0..100`). The Sound key toggles `?mute=1`.
- Hint: one line, "Tap a key or press <kbd>Cmd-K</kbd> to open the command menu". Touch variant (`pointer: coarse`) omits the kbd.

## Fit at 1280 x 800

The column is about 644px tall (the 632px mobile budget plus 12px for the 60px h1, with `mt-32` between subtitle and pad). It fits 800px with no scroll and about 156px spare. Content is top-aligned, not vertically centered. The footer is a single centered muted `llms.txt` link.

## Motion

Entry choreography: hero lines and pad fade up (`translate-y-4 blur-sm opacity-0` to rest, 700ms on `--ease-spring`, 60ms stagger). Pure CSS, only `transform`, `opacity`, `filter`. Disabled under `prefers-reduced-motion`. Pad box is final from first paint, CLS 0. Key press is 60ms on `--ease-key`.

## Texture

One `fixed inset-0 pointer-events-none` grain pseudo-element on `body` at `opacity-[0.03]`, above the dot grid. Never on a scrolling container. `backdrop-blur` only on the sticky pill and overlays.

## URL states for this screen

| URL | Expected |
|---|---|
| `/` | hero + pad, no overlay |
| `/?highlight=100` | dial turned fully right, strong steady brand glow on navigation keys (Work, About, Log, Find) |
| `/?mute=1` | Sound key shows VolumeX |
| `/?theme=dark` / `/?theme=light` | palette switches, chassis stays dark in both |
| `/?locale=es` | legends in Spanish, each at most about 8 characters, no overflow of the 71px cap |

## Palette map (tokens, see `.agents/docs/tokens.md`)

| Element | Token | Light | Dark |
|---|---|---|---|
| page | `page` | `#fcf9f4` | about `#141112` |
| name "Amrita" | `brand` | `#8b3a42` | `#c4767e` |
| chip surface | `surface-muted` | `#f0ede9` | `#232021` |
| cream key | `key-cream` | `#f7f3ed` to `#eae4dc` | same |
| rose key | `key-rose` | about `#b9646d` to `#a85a63` | same |
| sage key (esc) | `key-sage` | `#e3ece6` to `#d4ded7` | same |
| chassis | `chassis` | `#2a2627` to `#1d1a1b` | `#2a2c31` to `#151619` |

## Decorative and a11y

- Page has exactly one `h1`. Focus ring is visible on every pill item and key.

## Overrides of high-end-visual-design

- No `py-24` on `/`. Vertical rhythm is set by the viewport budget in `mobile-vertical.md`. Content pages keep their current spacing.
- Lucide icons at `strokeWidth={1.5}`. No Phosphor, no inline SVG.
- Body font Plus Jakarta Sans Variable. Display Fraunces. Mono is the dits stack.
- Layout archetype is Editorial stack (single centered column). It stays one column above 768px by decision, no Editorial Split.
