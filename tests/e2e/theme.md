# Theme

URL state: `?theme=light|dark`. Absent means the OS preference.

## Flows

- `/?theme=dark` sets `data-theme="dark"` on `<html>` before first paint.
- `/?theme=light` sets `data-theme="light"`.
- `/` without a param leaves `data-theme` unset and follows `prefers-color-scheme`.
- An invalid value (`?theme=blue`) is ignored.
- The navbar theme toggle writes `theme` to the URL (replace, no history entry).
