---
name: intl-ai
description: Add or change UI strings and translate them with intl-ai. Use when touching src/i18n/messages or any user-facing copy.
---

# intl-ai

1. Edit `src/i18n/messages/en.json` only (flat `namespace_key`, ICU MessageFormat).
2. `set -a; source .env; set +a; pnpm intl-ai:fill` (needs `AI_MODEL_ID`, `AI_API_KEY`; never print them).
3. Spot-check ms, hi, es, ml. Fix bad output by hand, then `pnpm exec intl-ai review <key> --locale <l>`.
4. `pnpm intl-ai:check` must pass.
5. Use `m.key()` from `@/lib/i18n`. Do not hand-edit `src/i18n/paraglide/`.

Details: `.agents/docs/i18n.md`.
