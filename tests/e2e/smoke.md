# Smoke

Every route returns 200, has exactly one `h1`, and passes the axe gate in both themes.

## Flows

- `/`, `/research`, `/life` and `/photography` load with one `h1` each.
- Each route has no critical or serious axe violations in light and dark.
- `/llms.txt` is served as text and names the site.
- `/index.md`, `/research.md`, `/life.md` and `/photography.md` are served as `text/markdown`.
