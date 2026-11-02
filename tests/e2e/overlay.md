# Flow: hero overlay drawer

## Goal
The hero drawers are URL state: `?overlay=research|photography|life`. Below 640px a vaul bottom sheet, from 640px a docked right Radix dialog. Content is projected from the same collections the pages use.

## Checks
- `?overlay=research` opens a sheet on a phone, a docked panel on a desktop.
- The research drawer lists the publications and talks; titles trimmed to ~80 chars with the full title in `title`.
- The photography drawer shows a masonry of frames, the Instagram CTA (`https://www.instagram.com/filmi.nambi`) and the `/photography` link.
- The life drawer carries the same sections as the `/life` page (hobbies, bio, career).
- Close: Escape, Back, scrim click, close button. Back restores the exact `panel` position.
- While open: track `inert` and `overflow: hidden`, `html[data-overlay-open]` set.
- `panel` is owned by the slider script, `overlay`/`scroll`/`nav` by nuqs.
