# Flow: photography lightbox

## Goal
The photography grid opens each frame in a native `<dialog>`. The dialog owns focus trapping and Escape, so the only behaviour worth testing is opening, stepping and closing.

## Checks
- The grid renders every photo.
- Clicking a thumbnail opens the dialog on that photo (`1 of N`).
- The next/previous buttons step between frames.
- Arrow keys step between frames.
- The close button closes the dialog.
- Escape closes the dialog.
- The counter reads `index of total`.
