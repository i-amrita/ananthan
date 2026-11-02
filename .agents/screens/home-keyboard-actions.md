# Screen: macropad action keys map

> TARGET state. The 75-key keyboard is replaced by an 11-key, 4-column macropad (12 grid cells, the Let's build key is 2u). Eight keys are real buttons bound to an `actionId`. Three (Research, LinkedIn, Let's build) are real anchors (`kind: 'link'`) with an `href` and no action.
> Physical hotkeys stay live because the listeners are window-level. A pad key shows pressed when any pressed code maps to its `actionId`.

## Layout

```
cols:   1         2         3         4
row 1  [ esc  ] [ dial  ] [Sound ] [ Find ]
row 2  [ Work ] [ About ] [Research] [ Log  ]
row 3  [LinkedIn] [  LET'S BUILD (2u)  ] [Locale]
```

## Key mapping (PAD_KEYS in `keyboard-layout.ts`)

| Row | Key id | Legend (en) | Icon (lucide, stroke 1.5) | Action id | Rep. code (`press()`) | Variant | Also lit by physical keys | URL state change |
|---|---|---|---|---|---|---|---|---|
| 1 | `esc` | esc | none | `close` | `Escape` | sage | `Escape` | `?overlay=` and `?cmdk=` removed |
| 1 | `dial` | none (knurled dial, `kind: 'dial'`, `role=slider`) | none | none | `Dial` | dial | none | `?highlight=0..100` (absent = 0); rotates -135deg to +135deg |
| 1 | `sound` | Sound | `Volume2` / `VolumeX` | `mute` | `F5` | cream | `F5` | `?mute=1\|0`, icon reflects state |
| 1 | `find` | Find (with a sparkle) | `Sparkles` | `search` | `F4` | rose | `F4`, `s` | `?cmdk=open` |
| 2 | `work` | Work | `LayoutGrid` | `projects` | `F2` | rose | `F2`, `p` | `?overlay=projects` |
| 2 | `about` | About | `Smile` | `about` | `F1` | cream | `F1`, `a` | `?overlay=about` |
| 2 | `research` | Research | `Books` | none (link) | `Link:research` | cream | none | opens `SOCIALS.research` in a new tab |
| 2 | `log` | Log | `BookOpen` | `log` | `F3` | cream | `F3`, `b` | `?overlay=log` |
| 3 | `linkedin` | LinkedIn (brand, not translated) | `Linkedin` | none (link) | `Link:linkedin` | rose | none | opens `SOCIALS.linkedin` in a new tab |
| 3 | `email` (2u, `span: 2`) | Let's build (sparkle on each side) | `Sparkles` x2 | none (link) | `Link:email` | cream | none | `mailto:<EMAIL>`, same tab |
| 3 | `locale` | current code (`EN`, `MS`, `HI`, `ES`, `ML`) | none | `locale` | `AltLeft` | cream | `AltLeft`, `AltRight`, `l` | `?locale=ms\|hi\|es\|ml\|en` (cycle) |

Notes:

- Link keys have `data-action` equal to their id (`research`, `linkedin`, `email`), their own non-bound press codes, and are never lit by physical keys. They still animate, click and vibrate on press.
- No pad key maps to `cmdk`. The palette stays reachable by Cmd/Ctrl+K, the navbar button and `?cmdk=open`. Physical `Space`, `Enter` and `Meta` keep their `cmdk` binding but light no pad key. Search from the pad is the Find key.
- Legends use short i18n keys: `key_esc`, `key_sound`, `key_find`, `key_work`, `key_about`, `key_research`, `key_log`, `key_build` (LinkedIn is a literal brand name). Each legend is at most about 8 characters so it fits a 71px cap.
- F7 to F12, Tab, Caps, arrows and the rest of the old typing keys no longer have pad keys. Hotkeys without a pad key (arrows in overlays, scroll keys) keep their overlay behavior and light nothing.

## Variants and legend contrast

| Variant | Used by | Tokens | Legend |
|---|---|---|---|
| cream | Sound, About, Research, Log, Let's build, Locale | `key-cream` gradient, `key-cream-side`, `key-cream-fg` | `#3c262a` |
| rose | Find, Work, LinkedIn | `key-rose` gradient, `key-rose-side`, `key-rose-fg` | `#fffaf6`, at least 4.5:1 |
| sage | esc | `key-sage` gradient, `key-sage-side`, `key-sage-fg` | `#36443c` |
| dial | highlight | knurled knob on the plate, brand pip | none |

Keycaps keep the same colors in light and dark. Only the chassis surround, page and text follow the theme (the chassis stays dark in both).

## Interaction contract

- Pointer: act on `pointerdown`. A `click` with `detail === 0` (keyboard Enter or Space on a focused key) also acts. Never both for one gesture. Link keys are native anchors: the browser activates them on click and Enter.
- Press visual: cap moves down 4px, side sliver collapses, 60ms on `--ease-key`. Reduced motion: color change only.
- Haptics: `navigator.vibrate?.(12)` on pointer press.
- Audio: click plays unless `?mute=1`. The first tap unlocks the AudioContext.
- Focus: each key is tabbable. Accessible name starts with the visible legend (WCAG 2.5.3), for example "Work Projects", "Sound Mute sounds", "Let's build Email" (link keys without a name suffix, such as LinkedIn and Research, expose just the legend).
- Minimum key width 44px (actual about 71px, 152px for 2u).

## Highlight

The dial (slider named "Highlight action keys", 0 to 100) writes `?highlight=` with history `replace`. Drag around its center, scroll over it, or use ArrowUp/Right +5, ArrowDown/Left -5, PageUp/Down +-20, Home 0, End 100. A plain tap cycles 0, 50, 100, 0. A detent tick plays every 5 steps (synthesized, see `.agents/docs/audio.md`). The intensity sets `--glow` (0..1) on the pad group and the navigation keys (Find, Work, About, Log) glow in proportion (steady, no pulse, no mount animation). At 0, no key glows except the transient pressed state. Sound, dial, esc, Locale and the three link keys are never glowed by the highlight.

## Keyboard-driven overlays

A key press updates its URL param through `nuqs`. The overlay island reads the param and opens. The URL is the source of truth: Back closes the overlay, URLs are shareable and agent-replayable. With `?mute=1` actions still trigger but no click audio plays.

## Test hooks (e2e at 375 x 667)

| Step | Expect |
|---|---|
| tap Work | URL has `?overlay=projects` |
| tap Sound | URL toggles `?mute=1` |
| tap dial | `?highlight=` cycles 50, 100, none; ArrowRight on the focused slider adds 5; End sets 100 |
| tap Find | URL has `?cmdk=open` |
| link keys | `href` is `mailto:`, the LinkedIn URL and the research URL; LinkedIn and Research have `target=_blank` |
| press `F2` | Work lights while held |
| tick highlight | URL has `?highlight=1` and nav keys glow |
| every pad control (8 buttons + 3 links) | bounding width at least 44px |

## Overrides of high-end-visual-design

- No `py-24` on `/`. Vertical rhythm is fixed by the viewport budget in `mobile-vertical.md`.
- Lucide icons at `strokeWidth={1.5}`. No Phosphor.
- Body font Plus Jakarta Sans Variable. Key legends use the mono stack.
- Keycap CSS keeps the keythm recipe with Apache-2.0 attribution (NOTICE, header in `keyboard-themes.ts`). The sound sprite is not lifted.
