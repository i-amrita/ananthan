# Locales

State: `?locale=en|ms|hi|es|ml`. English is the default; the other four are translations of the same keys.

## Flows

- `/?locale=es` renders Spanish strings and sets `<html lang="es">`.
- An invalid locale (`?locale=xx`) falls back to English.
- `/?locale=ml` renders Malayalam strings.
- `/research?locale=hi` renders the Hindi section headings.
- The nav chip shows the current locale code (`en`, `ms`, ...) and opens the picker; picking a locale switches locale and keeps the other URL params.
- The shutter (bottom-right) flips to the next locale on a tap and wraps around; it shows no code of its own and opens no popover.
- A chosen locale is stored and restored on the next visit, unless the URL carries an explicit one.
