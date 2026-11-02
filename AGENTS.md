# AGENTS.md

> Personal portfolio for Ananthan Nambiar. Astro 7 + React 19 islands. Static output to Cloudflare Pages.
> Canonical agent index — kept under 200 lines. Read once per session, drill in on demand.

## Commands

- `mise install` — pin Node 24, pnpm 12, intl-ai from `mise.toml`
- `pnpm install` — install deps (lockfile committed)
- `pnpm dev` — Astro dev on http://localhost:4321
- `pnpm build` — `astro build && pagefind --site dist`
- `pnpm preview` — serve `dist/` locally on :4322
- `pnpm check` — `astro check && tsc --noEmit`
- `pnpm lint` — `oxlint .`
- `pnpm format` — `oxfmt --write .`
- `pnpm format:check` — `oxfmt --check .`
- `pnpm test:e2e` — Playwright via `tests/playwright.config.ts`
- `pnpm deploy` — `wrangler deploy` (after `pnpm build`)
- `pnpm intl-ai:fill` — translate missing keys in `ms.json` / `hi.json` / `es.json` / `ml.json`
- `pnpm intl-ai:check` — CI gate for missing/stale translations

## Hard rules

- **No `npm`/`npx`.** Use `pnpm` and `pnpm dlx`. Misuse the package manager and the build breaks.
- **No global Verdaccio config.** All registry config lives in this repo's `.npmrc`.
- **No global env mutations.** Tool versions pinned via `mise.toml`, never `nvm install`.
- **All UI state lives in the URL.** Use `nuqs` for React islands, `Astro.url.searchParams` for routes. Every visible state must be reachable as a static URL.
- **Every content page has a `.md` companion.** The same content source feeds HTML + `.md` + `llms-full.txt`.
- **No real LLM for search.** Pagefind + transformers.js MiniLM-L6-v2 + RRF, all in the browser. See `.agents/docs/search.md`.
- **No hand-edited `llms.txt`.** Generated at build time from content collections.
- **No invented facts about Ananthan.** Anything not verifiable from the spec or his public pages is a `draft: true` placeholder with a TODO the owner fills in; draft entries never ship.
- **Use `oxlint`/`oxfmt`.** Never ESLint or Prettier.
- **Source Available, not OSS.** License is PolyForm Noncommercial 1.0.0. Don't add MIT/Apache headers to new files except where required (keycap CSS attribution, see NOTICE).
- **Photographs are his.** Never fabricate or substitute an image presented as his work; `public/photos/` holds clearly marked placeholder frames until he supplies the real ones.
- **Gitflow.** Default branch = `develop`. Feature branches off `develop`. Release branches merge to `main`.

## Layout

```
src/
  pages/         # file = route: /, /research, /life, /photography. Each has a sibling .md.ts endpoint.
  components/
    astro/       # static, no JS (FigureField, Navbar, ProseLayout)
    react/       # interactive islands (.tsx) (PhotoLightbox, NavbarActions, StaticCopy, search)
  content/       # Astro content collections (publications, talks, courses, figures, photos)
  i18n/          # Paraglide + intl-ai source
  lib/           # shared logic (content, search, url-state, theme, og, jsonld)
  styles/        # tokens.css + global.css

public/          # static assets, photos, grain, OG images
content/         # NOT USED — content lives under src/content/ (Astro convention)

.agents/
  docs/          # agent-facing deep dives (architecture, build, search, llms, url-state)
  skills/        # progressive-disclosure skills
  screens/       # ASCII layouts
  plans/         # gitignored — active planning

docs/            # public, generic docs (mirrors .agents/docs/architecture.md, no personal info)
```

## Read when…

- touching build pipeline → `.agents/docs/build.md`
- changing search → `.agents/docs/search.md`
- touching agent-facing URLs → `.agents/docs/llms.md`
- touching URL state binding → `.agents/docs/url-state.md`
- changing architecture → `.agents/docs/architecture.md` (and `docs/architecture.md`)
- adding a figure → `src/content/figures/` (one YAML file, see the spec under `docs/design/`)
- planning a non-trivial change → `.agents/plans/YYYY-MM-DD-<slug>.md`

## Don't

- Don't add Pages Functions or SSR routes. Static-only.
- Don't add Google Fonts CDN. Self-host WOFF2 via `@fontsource/*`.
- Don't add a CMS. Content collections + MDX are the source of truth.
- Don't add analytics until launch decision is explicit.
- Don't hand-edit generated files (`llms.txt`, `llms-full.txt`, `dist/`).
- Don't commit `.env`, `.env.local`, secrets, or tokens.
- Don't push directly to `main`. PR from feature branch.
