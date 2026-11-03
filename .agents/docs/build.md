# Build, CI and deploy

## Commands

- `pnpm dev` serves Astro on http://localhost:4321.
- `pnpm build` runs `astro build && pagefind --site dist`.
- `pnpm preview` serves `dist/` on :4322.
- `pnpm check`, `pnpm lint`, `pnpm format:check` are the static gates.
- `pnpm audit:links` runs `static-link-sentinel` over `dist/` (internal links, assets, anchors, case mismatches; external links are not fetched).
- `pnpm audit:site` builds with `astro.audit.config.mjs`, which adds `@casoon/astro-post-audit` (canonical, alternates, h1, sitemap, orphans, landmarks). Only errors fail; warnings are logged. It overwrites `dist/` without Pagefind, so run `pnpm build` again before previewing.
- `pnpm test:e2e` runs Playwright with `tests/playwright.config.ts`.

`astro-post-audit` was unpublished from npm; the maintained package is `@casoon/astro-post-audit`. Its postinstall downloads a prebuilt binary, so it is listed in `allowBuilds` in `pnpm-workspace.yaml`.

## CI (`.github/workflows/ci.yml`)

Runs on PRs and pushes to `develop` and `main`. Tooling comes from the local composite action `.github/actions/setup`: `pnpm/action-setup` (reads `packageManager`), `actions/setup-node` (reads `.nvmrc`), then `pnpm install --frozen-lockfile`.

- `quality`: lint, format check, `astro check` + `tsc`, and an advisory `intl-ai:check` (`continue-on-error` until a locale flips on).
- `build`: `pnpm build`, link audit, uploads `dist` as an artifact.
- `post-audit`: `pnpm audit:site` in parallel with the others.
- `e2e`: downloads `dist`, caches Chromium, runs `pnpm test:e2e` (including axe, 0 critical or serious). Uploads `playwright-report` and `test-results` on failure.

`.github/workflows/lighthouse.yml` runs on PRs to `main` with Moto G Power mobile emulation and slow 4G throttling (`.github/lighthouserc.json`). Budgets: LCP under 2.0s, CLS under 0.05, TBT under 200ms as the INP proxy. It is wired but `continue-on-error` until scores stabilise.

## Deploy

Cloudflare's git integration builds and deploys. Production branch is `main`, preview branch is `develop`. No deploy workflow exists and the repo holds no Cloudflare secrets. `.github/workflows/deploy-check.yml` runs on pushes to `main` (and manually), polls https://ananthan.nambiar.my for up to 10 minutes until it returns 200 with "Amrita" in the HTML, then requires `/llms.txt` and `/about.md` to return 200.

## Running e2e locally

- First time: `pnpm exec playwright install chromium`.
- `pnpm test:e2e` builds, starts `pnpm preview` on :4322 (reusing one if already running) and runs the specs.
- `SKIP_BUILD=1 pnpm test:e2e` skips the build when `dist/` is fresh.
- `BASE_URL=https://ananthan.nambiar.my pnpm test:e2e` runs against a deployed site with no local server.
- Each `tests/e2e/*.md` is a flow definition with a sibling `*.spec.ts` (enforced by `headings-sync.spec.ts`). Specs for unbuilt features use `test.fixme` with a `TODO(feature)` note; flip them to `test` as features land.
- `tests/fixtures/axe.ts` exports `expectNoSeriousA11y(page)`.

## Open Graph images

`src/lib/og.ts` renders 1200x630 PNG cards with satori (layout) and `@resvg/resvg-js` (raster), using the self-hosted `@fontsource/fraunces` woff files (weights 400 and 600). Static endpoints `src/pages/og/default.png.ts` and `src/pages/og/work/[slug].png.ts` emit them during `astro build` (about 20ms each), so there is no runtime server. `Base.astro` takes an `ogImage` path (default `/og/default.png`) and writes absolute og:image and twitter:image URLs from `site`. Project pages pass `/og/work/<slug>.png` through `ProseLayout`.

## Site configuration (`.env`)

Personal links are read at build time from `PUBLIC_*` variables through `src/lib/site.ts` (`import.meta.env`). Copy `.env.example` to `.env` and fill it in; `.env` is gitignored, `.env.example` is committed and holds no secrets.

| Variable | Used by | Fallback |
|---|---|---|
| `PUBLIC_EMAIL` | "Let's build" key, Copy email action | `hello@example.com` |
| `PUBLIC_LINKEDIN_URL` | LinkedIn key, About links | placeholder LinkedIn URL |
| `PUBLIC_RESEARCH_URL` | Research key, About links | `https://example.com/research` |
| `PUBLIC_CV_URL` | About links | empty (link hidden) |

Unset or empty values use the fallback. The values are public and inlined into the client bundle, so never put secrets in them. On Cloudflare, set them as build variables in the project settings. Restart `pnpm dev` after changing `.env`.
