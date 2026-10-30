# Locales

State: `?locale=en|ms|hi|de|ml`. English is the default; the other four are translations of the same keys.

## Flows

- `/?locale=de` renders German strings and sets `<html lang="de">`.
- An invalid locale (`?locale=xx`) falls back to English.
- `/?locale=ml` renders Malayalam strings.
- `/research?locale=hi` renders the Hindi section headings.
- The navbar language picker switches locale and keeps the other URL params.
- A chosen locale is stored and restored on the next visit, unless the URL carries an explicit one.
