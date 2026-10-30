# Flow: hero slider

## Goal
The home hero is a four-panel focus slider (intro, research, life, photography) on a native scroll-snap track. The active panel is in the URL as `?panel=N`, so every panel state is reachable as a static URL.

## Checks
- Four panels and four dot buttons render on `/`.
- The first panel is focused on load with no `panel` param.
- `ArrowRight`/`ArrowLeft` move one panel and update `?panel=`.
- `End`/`Home` jump to the last/first panel.
- Dot buttons select their panel.
- `?panel=N` restores that panel on load; out-of-range values clamp.
- Each panel links into its route (life, research, life, photography).
- The panel links exist even with JavaScript disabled.
