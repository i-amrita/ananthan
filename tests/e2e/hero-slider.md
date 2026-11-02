# Flow: hero slider

## Goal
The home hero is a four-panel focus slider (Intro, Research, Photography, Life) on a native scroll-snap track. The active panel is in the URL as `?panel=N`, so every panel state is reachable as a static URL.

## Checks
- Four panels render on `/`, in the order Intro, Research, Photography, Life.
- The landing carries no background photograph, no photo scrim and no viewfinder brackets.
- The first panel is focused on load with no `panel` param.
- `ArrowRight`/`ArrowLeft` move one panel and update `?panel=`.
- `End`/`Home` jump to the last/first panel.
- The ruler stops select their panel.
- `?panel=N` restores that panel on load; out-of-range values clamp.
- The Intro panel has no CTA and carries the social links as icon-only anchors; the other three link into their route (research, photography, life).
- The panel links exist even with JavaScript disabled.
- The panel content is sharp on a stop and blurred between stops; the navbar, the ruler and the shutter stay outside the blurred layer.
