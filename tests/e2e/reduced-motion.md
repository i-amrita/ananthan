# Flow: reduced motion

## Goal
`prefers-reduced-motion: reduce` freezes the ink draw-in and the panel snap. The page must stay fully usable: the hero still responds to the keyboard and nothing animates.

## Checks
- The hero renders four panels and still responds to `ArrowRight`.
- The figure field's strokes are not running an animation.
- Nothing under `main` has a running CSS animation.
