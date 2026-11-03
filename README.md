# Ananthan Nambiar

Personal portfolio of Ananthan Nambiar, live at https://ananthan.nambiar.my. Astro 7 and React 19 islands, static output to Cloudflare Pages. Source available under PolyForm Noncommercial 1.0.0. Agent index: `AGENTS.md`.

## Setup

```sh
mise install
pnpm install
cp .env.example .env
pnpm dev
```

## Configuration

Personal links come from `PUBLIC_*` variables in `.env` (`PUBLIC_EMAIL`, `PUBLIC_LINKEDIN_URL`, `PUBLIC_RESEARCH_URL`, `PUBLIC_CV_URL`). `.env.example` documents each one and every value falls back to a placeholder in `src/lib/site.ts`, so the site builds without a `.env`. The values are public and inlined at build time, so never put secrets in them. Details: `.agents/docs/build.md`.

`AI_BASE_URL`, `AI_MODEL_ID` and `AI_API_KEY` in `.env` configure the translation provider for `pnpm intl-ai:fill` (any OpenAI-compatible endpoint). They are build-time tooling only and are never shipped. `.env` is gitignored.

## Translations

English is the source (`src/i18n/messages/en.json`). Spanish, Hindi, Malay and Malayalam are generated with `intl-ai`: run `set -a; source .env; set +a; pnpm intl-ai:fill`, then `pnpm intl-ai:check`. Generated strings stay marked unreviewed until a native speaker reads them. Details: `.agents/docs/i18n.md`.

## Deploy

Cloudflare Pages builds from `main`. Build command `pnpm build`, output directory `dist`, install command `pnpm install --frozen-lockfile`, `NODE_VERSION=24`.

## Commands

`pnpm dev`, `pnpm build`, `pnpm preview`, `pnpm check`, `pnpm lint`, `pnpm format:check`, `pnpm test:e2e`, `pnpm intl-ai:fill`, `pnpm intl-ai:check`. Full list in `AGENTS.md`.
