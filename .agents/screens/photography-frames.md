# Photography frames

Route: `/photography`. Reusable framing: `.photo-frame` in `src/styles/global.css`.

## Layout

```
[ProseLayout: eyebrow "Frames", intro]
[PhotoLightbox grid: 2 cols @375, 3 cols @768/1280]
  each card (button):
    +----tl----------------tr----+
    | L                    L     |   corner marks inset 11px,
    |        photo (cover)       |   legs 16px, 1.5px, ink colour,
    |                            |   light+dark aware
    +----bl----------------br----+
    caption row below photo
[placeholder note + Instagram CTA]
```

## Behaviour

- Corner marks always visible at 0.7 opacity; hover/focus-visible tightens inset by 2px and raises opacity to 1 (spring ease). `prefers-reduced-motion`: opacity only, no movement.
- Touch (no hover): marks stay at rest state, always visible.
- Marks sit on the image area only (`.photo-frame` wraps the `img`), caption stays uncovered.
- Lightbox dialog unchanged.

## Reuse

Landing Photography drawer (other session) can wrap any image in:

```html
<span class="photo-frame"><i class="pf-c pf-tl"/><i class="pf-c pf-tr"/><i class="pf-c pf-bl"/><i class="pf-c pf-br"/><!-- img --></span>
```
