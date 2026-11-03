# Screen: figure field (Memphis background)

> Replaces the ink-brush draw-in. Sibling inspiration: the pyscriptc landing `HeroMeshGrid` (a pool of pre-placed cells, a bounded number alive, each fading in and out over 3.5s to 5s).

```
375x812                          1280x800
┌───────────────────────┐        ┌────────────────────────────────────────────┐
│ [navbar pill]  (safe) │        │ [navbar pill]                       (safe) │
│  ~ figures band  ◐ ▲  │        │ ◐ ▲        figures band           ╱╲╱╲ ⋰⋰ │
│  ⋰⋰   ≈≈              │        │ ≈≈        ┌─────────────┐             ○    │
│───────────────────────│        │           │ copy-safe   │                  │
│  copy-safe zone       │        │ ╱╲╱╲      │ (centred    │          ⋰⋰⋰     │
│  (title, body, CTA)   │        │           │  text)      │                  │
│───────────────────────│        │           └─────────────┘          ◠       │
│  ◠  ⋰⋰  ╱╲╱           │        │ [hint, dots, dock]                  (safe) │
│ [hint, dots, dock]    │        └────────────────────────────────────────────┘
└───────────────────────┘
```

## Behaviour

- Every figure of the route (its own plus the `route: all` Memphis set) is laid out once, deterministically (seeded by route), in two layouts: phone and 768px up. Figures never enter the copy-safe zone (chrome plus the centred text) and never overlap each other. A figure that finds no slot in a layout is simply not rendered there.
- Figures start invisible. A tiny inline scheduler fades a random idle figure in and out over 3.5s to 5s each, with a bounded number alive (6 phone, 10 wide), picking a new one every 250 to 700ms while there is room.
- Per figure `motion`: `drift` (translate and tilt), `spin`, `pulse` (scale), `draw` (stroke draws itself in). Only opacity and transform animate, plus the dash offset for `draw`. `will-change` is set only while a figure is alive.
- Colour: ink tokens, or the three Memphis pops (`--c-pop-coral|teal|mustard`). On home the ink tone is the lighter `--c-ink-soft`.
- Reduced motion and no-JS: a static scattering at fixed low opacity, no scheduler. The scheduler pauses while the tab is hidden.
- Must not collide with copy at 375x812, 768x1024 and 1280x800, light and dark.
